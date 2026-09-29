<?php

namespace Acme\Inventory\Infrastructure;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use RuntimeException;
use ZipArchive;

final class TiStockWorkbookReader
{
    public const VERSION = '1.0.0-canonical';

    public const MAX_ROWS = 20_000;

    public const MAX_COLUMNS = 64;

    /** @return list<array{sheet:string,row:int,values:array<string, scalar|null>}> */
    public function read(string $path): array
    {
        $this->assertSafeArchive($path);
        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $reader->setReadEmptyCells(false);
        $reader->setReadFilter(new class implements IReadFilter
        {
            public function readCell(string $columnAddress, int $row, string $worksheetName = ''): bool
            {
                return $row <= TiStockWorkbookReader::MAX_ROWS && Coordinate::columnIndexFromString($columnAddress) <= TiStockWorkbookReader::MAX_COLUMNS;
            }
        });
        $book = $reader->load($path);
        if ($book->getSheetCount() > 20) {
            $book->disconnectWorksheets();
            throw new RuntimeException('A pasta de trabalho excede o limite de abas.');
        }
        $result = [];
        foreach ($book->getWorksheetIterator() as $sheet) {
            if ($sheet->getHighestDataRow() > self::MAX_ROWS || Coordinate::columnIndexFromString($sheet->getHighestDataColumn()) > self::MAX_COLUMNS) {
                $book->disconnectWorksheets();
                throw new RuntimeException('A planilha excede os limites de linhas ou colunas.');
            }
            $this->appendSheet($sheet, $result);
        }
        $book->disconnectWorksheets();

        return $result;
    }

    private function assertSafeArchive(string $path): void
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true || $zip->numFiles > 500) {
            throw new RuntimeException('O XLSX está inválido ou contém entradas demais.');
        }
        $expandedBytes = 0;
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $stat = $zip->statIndex($index);
            if ($stat === false) {
                $zip->close();
                throw new RuntimeException('Não foi possível verificar o conteúdo compactado.');
            }
            $entryName = strtolower($stat['name']);
            if (str_contains($entryName, 'vbaproject') || str_contains($entryName, 'externallinks/')) {
                $zip->close();
                throw new RuntimeException('Macros e vínculos externos não são aceitos.');
            }
            $expandedBytes += $stat['size'];
            if ($expandedBytes > 64 * 1024 * 1024 || ($stat['comp_size'] > 0 && $stat['size'] / $stat['comp_size'] > 200)) {
                $zip->close();
                throw new RuntimeException('O XLSX excede os limites seguros de expansão.');
            }
        }
        $zip->close();
    }

    /** @param list<array{sheet:string,row:int,values:array<string, scalar|null>}> $result */
    private function appendSheet(Worksheet $sheet, array &$result): void
    {
        $highestRow = min($sheet->getHighestDataRow(), self::MAX_ROWS);
        $highestColumn = min(Coordinate::columnIndexFromString($sheet->getHighestDataColumn()), self::MAX_COLUMNS);
        if ($highestRow < 2) {
            return;
        }
        $headers = [];
        for ($column = 1; $column <= $highestColumn; $column++) {
            $headers[] = $this->normalize((string) $sheet->getCell(Coordinate::stringFromColumnIndex($column).'1')->getValue());
        }
        for ($row = 2; $row <= $highestRow; $row++) {
            $values = [];
            foreach ($headers as $index => $header) {
                if ($header === '') {
                    continue;
                }
                $coordinate = Coordinate::stringFromColumnIndex($index + 1).$row;
                $cell = $sheet->getCell($coordinate);
                $value = $cell->getDataType() === DataType::TYPE_FORMULA ? null : $cell->getValue();
                if (is_scalar($value) || $value === null) {
                    $values[$header] = $value;
                }
            }
            if (count(array_filter($values, static fn ($value): bool => $value !== null && $value !== '')) === 0) {
                continue;
            }
            $result[] = ['sheet' => mb_substr($sheet->getTitle(), 0, 120), 'row' => $row, 'values' => $values];
        }
    }

    private function normalize(string $header): string
    {
        $header = mb_strtolower(trim($header));
        $header = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $header) ?: $header;
        $header = preg_replace('/[^a-z0-9]+/', '_', $header) ?? '';

        return trim($header, '_');
    }
}
