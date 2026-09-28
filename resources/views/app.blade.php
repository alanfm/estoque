<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Starter Kit</title>
    <script>
        (function () {
            try {
                var stored = window.localStorage.getItem('starterkit.theme');
                var preference = stored === 'light' || stored === 'dark' ? stored : null;
                var resolved = preference || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', resolved);
            } catch (error) {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        })();
    </script>
    @viteReactRefresh
    @vite('resources/spa/main.tsx')
</head>
<body>
    <div id="app"></div>
</body>
</html>
