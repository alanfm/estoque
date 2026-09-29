FROM php:8.5-cli-bookworm AS php-dependencies

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libicu-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd intl pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www/html
COPY . .
RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --optimize-autoloader \
    && php artisan core:modules:diagnose --json

FROM node:22-bookworm-slim AS frontend-build

WORKDIR /var/www/html
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM php:8.5-fpm-bookworm AS app

ARG RELEASE_VERSION=local
ARG VCS_REF=unknown

RUN apt-get update \
    && apt-get install -y --no-install-recommends libicu-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd intl pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY --from=php-dependencies /var/www/html/app ./app
COPY --from=php-dependencies /var/www/html/artisan ./artisan
COPY --from=php-dependencies /var/www/html/bootstrap ./bootstrap
COPY --from=php-dependencies /var/www/html/config ./config
COPY --from=php-dependencies /var/www/html/database ./database
COPY --from=php-dependencies /var/www/html/modules ./modules
COPY --from=php-dependencies /var/www/html/public ./public
COPY --from=php-dependencies /var/www/html/resources/views ./resources/views
COPY --from=php-dependencies /var/www/html/routes ./routes
COPY --from=php-dependencies /var/www/html/storage ./storage
COPY --from=php-dependencies /var/www/html/vendor ./vendor
COPY --from=frontend-build /var/www/html/public/build /var/www/html/public/build
COPY docker/production/php-fpm.conf /usr/local/etc/php-fpm.d/zz-starterkit.conf
COPY docker/production/php.ini /usr/local/etc/php/conf.d/zz-starterkit.ini

RUN mkdir -p storage/app storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs bootstrap/cache /var/lib/starterkit \
    && chown -R www-data:www-data storage bootstrap/cache /var/lib/starterkit \
    && chmod -R ug+rwX storage bootstrap/cache /var/lib/starterkit

ENV APP_ENV=production APP_DEBUG=false LOG_LEVEL=info
LABEL org.opencontainers.image.version="${RELEASE_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}"
USER www-data
EXPOSE 9000
CMD ["php-fpm", "-F"]

FROM nginx:1.27-alpine AS web

ARG RELEASE_VERSION=local
ARG VCS_REF=unknown

COPY docker/production/nginx.conf /etc/nginx/nginx.conf
COPY docker/production/site.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /var/www/html/public /var/www/html/public

LABEL org.opencontainers.image.version="${RELEASE_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}"

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
