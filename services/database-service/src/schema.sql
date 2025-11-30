if not exists (
    select 1
    from sys.databases
    where
        name = 'warpdeploy'
) begin
create database warpdeploy;

exec ('Create database success') end

use warpdeploy;
go

if not exists (
    select 1
    from sys.tables
    where
        name = 'users'
) begin
create table users (
    id int primary key identity (1, 1),
    username nvarchar (50) not null,
    passwordhash nvarchar (255) not null,
    email nvarchar (100) not null,
    createdat datetime2 not null default sysdatetime ()
);

end 
if not exists (select 1 from sys.tables  where name = 'users') 
begin 
	create table users ( 
	email_user  char(30) primary key, 
    username varchar not null,
    password_hash varchar(255) not null,
    role_at char(30) default 'users',
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp, 
    github_username varchar(255),
    github_token varchar(255),
	)
end
select  * from users


if not exists (
    select 1
    from sys.tables
    where
        name = 'cloud_server_user'
) begin
create table cloud_server_user (
  
    id int primary key identity (1, 1),
    email_user char(30) foreign key references users(email_user), 
    clusterServer varchar(30),
    certificateAuthorityData varchar(248),
    clientCertificateData varchar(248),
    clientKeyData varchar(248),
    token varchar(248),
    namespace varchar(30),
    clusterName varchar(30),
    contextName varchar(30)
) end

drop table  users




select * from sys.tables t