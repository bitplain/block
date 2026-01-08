# Терминальный дашборд Ethereum-портфеля

Полноэкранный терминальный интерфейс для анализа Ethereum-адреса: синхронизация транзакций, расчет исторических цен ETH и отображение данных в адаптивной панели.

## Возможности

- Получение входящих и исходящих транзакций через Etherscan.
- Определение исторической цены ETH/USD для входящих транзакций через CoinGecko.
- Хранение данных в PostgreSQL с идемпотентным upsert.
- Полноэкранный терминальный UI с графиком и адаптивной версткой.
- Полная контейнеризация (backend, frontend, база данных) с health check.

## Структура проекта

```
backend/       # Node.js/Express API + PostgreSQL
frontend/      # Статический терминальный интерфейс, отдаваемый Nginx
.env.example   # Пример переменных окружения
Dockerfile     # Dockerfile для сервисов
```

## Настройка

1. Скопируйте шаблон переменных окружения:

```bash
cp .env.example .env
```

2. При необходимости измените значения в `.env`:

- `ETHERSCAN_API_KEY`: ключ API https://etherscan.io/apis
- `ETH_ADDRESS`: адрес Ethereum для анализа

## Запуск через Docker

Сборка и запуск:

```bash
docker-compose up --build
```

Остановка:

```bash
docker-compose down
```

Интерфейс доступен по адресу:

```
http://localhost:8080
```

## API

- `GET /api/transactions?address=0x...` — получить сохраненные транзакции.
- `POST /api/sync` — синхронизировать транзакции и сохранить в базу.

Пример:

```bash
curl -X POST http://localhost:8080/api/sync \
  -H "Content-Type: application/json" \
  -d '{"address": "0xYourEthereumAddress"}'
```

## Примечания

- CoinGecko имеет лимиты на частоту запросов: при большом объеме транзакций синхронизация может занять время.
- Значения транзакций хранятся в ETH, цена — в USD.
