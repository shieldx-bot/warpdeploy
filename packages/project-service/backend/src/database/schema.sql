CRAETE DATABASE IF NOT EXISTS WarmDeploy DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
use WarmDeploy
go
create  table if  not exists VerifyOtp ( 
    id int primary key auto_increment,
    email varchar(255) not null, 
    otp_code varchar(6) not null,
    created_at datetime  default current_timestamp,
    expires_at datetime not null,
    used boolean default false,
    index (email)
)
go
create table if not exists Users ( 
    email  varchar(255) primary key, 
    username varchar not null,
    password_hash varchar(255) not null,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp on update current_timestamp, 
    github_username varchar(255),
    github_token varchar(255),
    index(email, github_username)
)
go
create table if not exists ConnectRepos ( 
    id int primary key auto_increment,
    repo_name varchar(255) not null,
    repo_full_name varchar(255) not null,
    repo_url varchar(255) not null,
    branch_name varchar(255) not null,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp on update current_timestamp,
    unique key unique_repo (user_email, repo_full_name),
    index (user_email, repo_full_name),
    user_email varchar(255) constrain fk_user_email references USers(email),
)
go
create table if not exists deployments ( 
    id int primary key auto_increment,
    deployment_name varchar(255) not null,
    repo_id int not null,
    status varchar(50) not null,
    created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp on update current_timestamp,
    unique key unique_deployment (deployment_name, repo_id),
    index (deployment_name, repo_id),
    repo_id int constrain fk_repo_id references ConnectRepos(id),
    user_email constrain fk_user_email  references Users(email),
)
go
create table if not exists deployment_logs (
    id int primary key auto_increment, 
    log_message text not null,
    log_level varchar(50) not null,
    time_stamp datetime default current_timestamp,
    deployment_id int constrain fk_deployment_id references deployments(id),
)
go 
create table if not exists deployment_config ( 
    id int primary key auto_increment,
    ram int not null;
    cpu in not null;
    deployment_id int constrain fk_deployment_id references deployments(id),
)
