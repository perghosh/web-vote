# HostUp cloud solution

## SSH keys

*Print SSH key in windows to know what to add to cloud*  
`Get-Content C:\Users\ghosh\.ssh\id_ed25519.pub`  
Ändelsen `pub` beskriver att det är den publika delen
Passphrase is the normal login from card.

*Logon to server:* `ssh root@DIN_SERVER_IP` and ip to HostUp is: `64.112.125.165`.  
Type in terminal: `ssh root@64.112.125.165`

---

## Linux server 

Debian is used. And default upgrade is: `apt update` and `apt upgrade -y`  
Or (oneliner) `apt update && apt upgrade -y`

### Overview -- 

*Installation folder* =  `/opt/http`  

*Move one file*  
`scp -i ~/.ssh/id_ed25519 "D:\temp\vps\http" root@64.112.125.165:/opt/http/`
`scp -i ~/.ssh/id_ed25519 -r "D:\temp\vps\vote" root@64.112.125.165:/opt/http/` - copy all files in selected and subfolders

`scp -i ~/.ssh/id_ed25519 "D:\temp\vps\vote\js\document.js" root@64.112.125.165:/opt/http/vote/js`
`scp -i ~/.ssh/id_ed25519 root@64.112.125.165:/opt/http/vote/test.sqlite "D:\temp\vps\backup\"`


*Install odbc because that is needed for http server that has database connections*  
`apt install -y libodbc2`  
If it doesn't work then install this also `apt install -y unixodbc`

*Start http web server*
`/opt/http/http http --configuration "/opt/http/configuration.xml"`

*Restart server*
`systemctl restart http`

*Edit configuration file for systemctl*
`sudo nano /etc/systemd/system/http.service`

### Replace http server, the http application --

*Stop service holding http server*  `systemctl stop http`

*Upload new app* `scp -i ~/.ssh/id_ed25519 "D:\temp\vps\http" root@64.112.125.165:/opt/http/`  
*Set attributes* `chmod +x /opt/http/http`  
*Start service* `systemctl start http`  


### Create secret folder
UUID_NAME=$(uuidgen) && mkdir "$UUID_NAME" && echo "Din dolda mapp heter: $UUID_NAME"
mv page_poll_edit.html page_poll_question_edit.html "$UUID_NAME/"
ls -l "$UUID_NAME"
cp -r js "$UUID_NAME/"
cp -r css "$UUID_NAME/"


## Caddy

*Check configuration*
cat /etc/caddy/Caddyfile

*Sample to configure to folketsröst*
```
{
    servers {
        protocols h1 h2
    }
}

xn--folketsrst-lcb.se {
    reverse_proxy localhost:8001
}

123.45.67.89:80 {
    reverse_proxy localhost:8001
}
```



