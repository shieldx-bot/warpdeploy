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
    github_token varchar(255) 
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

drop table  cloud_server_user

go

INSERT INTO users (email_user, username, password_hash, role_at, github_username, github_token) VALUES
('admin@example.com', 'admin', '$2b$10$xyz123abc456def789ghi', 'admin', 'admin-github', 'NULL' ),
('john.doe@email.com', 'johndoe', '$2b$10$abc123def456ghi789jkl', 'user', 'johndev', 'NULL'),
('jane.smith@company.com', 'janesmith', '$2b$10$def456ghi789jkl012mno', 'user', 'janesmith', 'NULL'),
('mike.wilson@tech.org', 'mikewilson', '$2b$10$ghi789jkl012mno345pqr', 'moderator', 'mikew', 'NULL'),
('sarah.connor@future.net', 'sarahc', '$2b$10$jkl012mno345pqr678stu', 'user', 'sarahconnor', 'NULL'),
('alex.johnson@startup.io', 'alexj', '$2b$10$mno345pqr678stu901vwx', 'user', 'alexjohnson', 'NULL'),
('lisa.ray@design.com', 'lisaray', '$2b$10$pqr678stu901vwx234yza', 'user', 'lisaraydesign', 'NULL'),
('david.brown@devteam.com', 'davidb', '$2b$10$stu901vwx234yza567bcd', 'user', 'davidbrowndev', 'NULL'),
('emma.watson@webapp.com', 'emmaw', '$2b$10$vwx234yza567bcd890efg', 'user', 'emmawatson', 'NULL'),
('ryan.garcia@mobile.dev', 'ryang', '$2b$10$yza567bcd890efg123hij', 'user', 'ryangarcia', 'NULL'),
('olivia.martinez@cloud.io', 'oliviam', '$2b$10$bcd890efg123hij456klm', 'user', 'oliviamtz', 'NULL'),
('william.taylor@api.com', 'williamt', '$2b$10$efg123hij456klm789nop', 'user', 'wtaylor', 'NULL'),
('sophia.anderson@data.net', 'sophiaa', '$2b$10$hij456klm789nop012qrs', 'user', 'sophiaanders', 'NULL'),
('james.miller@backend.org', 'jamesm', '$2b$10$klm789nop012qrs345tuv', 'user', 'jamesmiller', 'NULL'),
('isabella.davis@frontend.com', 'isabellad', '$2b$10$nop012qrs345tuv678wxy', 'user', 'isad', 'NULL')





select * from sys.tables t