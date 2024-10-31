# IronPeak Carriers
This is a Node.js application with session-based and JWT authentication using PostgreSQL. Follow the instructions below to set up the application on a new Heroku instance.

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed.
- [Node.js](https://nodejs.org/) installed.
- [postgresql](https://wiki.postgresql.org/wiki/Homebrew) installed.

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/hypergeneric/ironpeak-excel-carrier-app
cd ironpeak-excel-carrier-app
```

### 2. Create a Heroku App

```bash
heroku create your-app-name
```

### 3. Set Up the Environment Variables
Copy the _env.sample file to .env:
```bash
cp _env.sample .env
```
Open the .env file in a text editor and update the following variables:
```bash
JWT_SECRET=YOUR_RANDOM_JWT_SECRET_KEY
SESSION_SECRET=YOUR_RANDOM_SESSION_SECRET_KEY
DATABASE_URL=postgres://YOUR_DATABASE_USERNAME:YOUR_DATABASE_PASSSWORD@YOUR_DATABASE_HOST:5432/YOUR_DATABASE_NAME
SMTP_HOST=YOUR_SMTP_HOST
SMTP_USER=YOUR_SMTP_USER
SMTP_PASS=YOUR_SMTP_PASSWORD
SMTP_PORT=YOUR_SMTP_PORT
RESET_FROM_EMAIL=YOUR_EMAIL_TO_SEND_RESETS
HEROKU_URL_BASE=https://YOUR_FULLY_QUALIFIED_DOMAIN_NAME/
```
### 4. Set Up PostgreSQL Database
Add the PostgreSQL add-on to your Heroku app:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```
Alternatively, if this command does not work, you can go to the "Resources" section in heroku and in the "Add-ons" portion of the screen search for "Heroku Postgres" and add.

Note: You may have to wait a couple of minutes for the database to be created before moving on to the next step.
### 5. Run init.sql

You will need to run an intial SQL file that initializes your database schema. To run this script, you can connect to your Heroku PostgreSQL database using the psql command:

Open the PostgreSQL shell and execute SQL
```bash
heroku pg:psql -a your-app-name-here
\i init.sql
```

Once complete type the following command to quit psql
```bash
\q
```

Retrieve the database URL from Heroku:
```bash
heroku config:get DATABASE_URL
```
Make sure to update the YOUR_DATABASE_USERNAME, YOUR_DATABASE_PASSSWORD, YOUR_DATABASE_HOST, and YOUR_DATABASE_NAME in your .env file with the correct values from the DATABASE_URL.

### 6. Create the First User

To create the first user, you'll need to hash their password using bcrypt. You can use bcrypt.online to generate the hash.

- Visit bcrypt.online.
- Enter the password you want to use for the user.
- Copy the generated hash.
- Insert the user into the database using psql:
```bash
    INSERT INTO users (email, password) VALUES ('user@example.com', 'hashed_password_here');
```
Replace 'hashed_password_here' with the hash you copied.

### 7. Deploy the Application

Commit your changes and deploy

```bash
git add .
git commit -m "Initial commit"
git push heroku main
heroku open
```
