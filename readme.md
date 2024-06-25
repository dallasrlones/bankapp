# Simple Bank Program

This is a simple bank program built with Node.js, TypeScript, PostgreSQL, and RabbitMQ. The application is containerized using Docker and Docker Compose.

## Features

- A bank has a name.
- A bank also has several accounts.
- An account has an owner and a balance.
- Account types include: Checking, Investment.
- There are two types of Investment accounts: Individual, Corporate.
- Individual accounts have a withdrawal limit of $500.
- Transactions are made on accounts.
- Transaction types include: Deposit, Withdraw, and Transfer.

## Prerequisites

- Docker
- Docker Compose

## Setup

1. Clone the repository:
2. Build and start the containers:

    ```bash
    docker-compose up --build
    ```

3. Run the Tests:

Open exec in the 'backend' container and run ```
    npm test
    ```

## Running the Application

Once the containers are up and running, the application will be available on port 3000.

### Endpoints

- **Deposit**

    ```http
    POST /transactions/deposit
    ```

    **Request Body:**

    ```json
    {
      "owner": "john.doe@test.com",
      "amount": 1000,
      "bank_id": 1
    }
    ```

- **Withdraw**

    ```http
    POST /transactions/withdraw
    ```

    **Request Body:**

    ```json
    {
      "owner": "john.doe@test.com",
      "amount": 500,
      "bank_id": 1
    }
    ```

- **Transfer**

    ```http
    POST /transactions/transfer
    ```

    **Request Body:**

    ```json
    {
      "sourceOwner": "john.doe@test.com",
      "targetOwner": "jane.doe@test.com",
      "amount": 200,
      "bank_id": 1
    }
    ```

## Running Tests

To run the tests, use the following command inside of the running "backend" docker container:

```bash
npm test
