-- Active: 1761362626604@@127.0.0.1@1433@warm_deploy@dbo
use warm_deploy
go



 

create  table  VerifyOtp ( 
    id int primary key identity(1,1),
    email varchar(255) not null, 
    otp_code varchar(6) not null,
    created_at datetime  default current_timestamp,
    expires_at AS DATEADD(MINUTE, 10, created_at) PERSISTED,
    used bit default 0,
  
);
create table Users ( 
    email_user  varchar(255) primary key, 
    username varchar not null,
    password_hash varchar(255) not null,
    role_at char(30) default 'users',
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp, 
    github_username varchar(255),
    github_token varchar(255),
     
);

go
create table ConnectRepos ( 
    id_cr int primary key identity(1,1),
    repo_name varchar(255) not null,
    repo_full_name varchar(255) not null,
    repo_url varchar(255) not null,
    branch_name varchar(255) not null,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp ,
    email_user varchar(255) foreign key references Users(email_user),
)
go
create table deployments ( 
    id_d int primary key identity(1,1 ) ,
    deployment_name varchar(255) not null,
    repo_id int not null,
    status varchar(50) not null,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp ,
    id_cr int foreign key references ConnectRepos( id_cr),
    email_user varchar(255) foreign key  references Users(email_user),
)
go
create table deployment_logs (
    id_dl int primary key identity, 
    log_message text not null,
    log_level varchar(50) not null,
    time_stamp datetime default current_timestamp,
    id_d int foreign key references deployments(id_d),
)
go 
create table deployment_config ( 
    id_dc int primary key identity(1,1),
    ram int not null,
    cpu int not null,
    id_d int foreign key references deployments(id_d),
)
go 
create table  Repos ( 
    id_r int primary key identity(1,1) ,
    [name] varchar, 
    full_name varchar, 
    html_url varchar, 
    email_user  varchar(255) foreign key references Users(email_user), 
)

go
create table  import_card (
    id_ic int primary key identity(1,1),
    repo_name varchar(255) not null,
    repo_full_name varchar(255) not null,
    repo_url varchar(255) not null,
    branch_name varchar(255) not null,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp ,
     user_email varchar(255) foreign key references Users(email_user),
)
go 
create table  info_server ( 
    server_ip varchar(50) primary key,
    host varchar(255),
    server_name varchar(255) not null,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp ,
    health_status varchar(50) not null,
)
create nonclustered index idx_offline 
on info_server(health_status) 
where health_status = 'offline';

create nonclustered index idx_ip_status 
on info_server(server_ip, health_status);

go
create table cpu_server (
 us int ,
sy int ,
ni int , 
id int  , 
wa int ,
hi int , 
si int ,
st int ,
create_at datetime default current_timestamp,
server_ip varchar(50) foreign key references info_server(server_ip)
on delete cascade
on update cascade
)
go
create table memory_server ( 
total int ,
used int ,
free int , 
shared int,
buff_cache int ,
available int,
server_ip varchar(50) foreign key references info_server(server_ip)
on delete cascade
on update cascade
)

go 
create table disk_server ( 
 getParmasDisk varchar(255), 
size float , 
used float, 
avail float,
usePercent float,
mountpoint varchar(255),
server_ip varchar(50) foreign key references info_server(server_ip)
on delete cascade
on update cascade
) 
go
create table net_server ( 
receive_KBps float,
transmit_KBps float,
server_ip varchar(50) foreign key references info_server(server_ip)
on delete cascade
on update cascade
)

go
create table logged_server ( 
username varchar(20),
terminal varchar(20),
ip_addres varchar(20), 
time_log datetime ,
action varchar(255),
server_ip  varchar(50) foreign key references  info_server(server_ip)
on delete cascade
on update cascade

)

select *  from info_server
insert into info_server(server_ip, server_name, host, health_status) values (
'1.2.22.2', 'ubuntu', 'tente.sn'  'online'
)

create table  info_server ( 
    server_ip varchar(50) primary key,
    host varchar(255),
    server_name varchar(255) not null,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp ,
    health_status varchar(50) not null,
)










 