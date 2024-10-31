create table uploads
(
    id                 serial
        primary key,
    uploaded_time      timestamp default CURRENT_TIMESTAMP,
    uploaded_user      varchar(255),
    uploaded_csv_data  text,
    is_live            boolean   default false,
    uploaded_file_name varchar(255)
);

create table users
(
    id                     serial
        primary key,
    email                  varchar(255) not null
        unique,
    password               varchar(255) not null,
    reset_token            varchar(255),
    reset_token_expiration timestamp
);


create table session
(
    sid      varchar      not null
        primary key,
    sess     json         not null,
    expire   timestamp(6) not null,
    "userId" integer
        constraint "sess_userId_fkey"
            references public.users
            on delete cascade
);
