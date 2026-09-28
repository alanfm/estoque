import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Pagination } from "./Pagination";
import type { PaginationMeta } from "../../types/api";

const meta: PaginationMeta = {
  currentPage: 1,
  from: 1,
  lastPage: 3,
  perPage: 20,
  to: 20,
  total: 42,
};

describe("Pagination", () => {
  test("desabilita a página anterior na primeira página", () => {
    render(<Pagination meta={meta} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Anterior/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Próxima/ })).toBeEnabled();
  });

  test("notifica a troca de página", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination meta={meta} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("não renderiza com uma única página", () => {
    const { container } = render(
      <Pagination meta={{ ...meta, lastPage: 1 }} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
