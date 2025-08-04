#!/bin/bash
bashdir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
. $bashdir/config.cfg

echo -e "Found $bashdir"
echo Script uses relative paths - Checking files
if [ -e $bashdir/sender/send.js ]; then
    echo Found JS sender
    if [ -e $bashdir/shell/discordrkn.sh ]; then
        echo Found shell
    else
        echo -e "ERROR. CANNOT FIND $bashdir/shell/discordrkn.sh . Aborting..."
        exit 1
    fi
else
    echo -e "ERROR. CANNOT FIND $bashdir/sender/send.js . Aborting..."
    exit 1
fi
echo Check complete
sleep 2
clear

echo Enter path where zapretyan will be and we prepare all for you
echo (If you want to change path to dir in the future, you will need to change them in config.cfg)
echo e.g. /root/zapretyan
read installpath

mkdir $installpath
if [ -d $installpath ]; then
    echo -e "Directory Created ($installpath)"
else
    echo -e "ERROR. CANNOT FIND $installpath . Do i have access to directory or my path is wrong?"
    exit 1
fi
sleep 2
clear

while true; do
    echo Zapretyan requires nodejs, npm, git, wget
    read -p "Do you want to install dependencies? (~430 MB of additional disk space can be used) Y/N" yn
    case $yn in
        [Yy]* ) apt install nodejs npm git wget -y; break;;
        [Nn]* ) break;;
        * ) echo "Please answer yes or no.";;
    esac
done
sleep 2
clear

echo If you change the method of parsing bans from antifilter to github, you will need additional binary to unpack .dat routing files
echo You need wget to download this
while true; do
    read -p "Do you want to download v2dat decompiler? (Optional)(9.6 MB) Y/N" yn
    case $yn in
        [Yy]* ) wget -t 5 -O shell/v2dat https://github.com/SHULKERPLAY/Zapretyan/raw/refs/heads/main/bin/v2dat; break;;
        [Nn]* ) break;;
        * ) echo "Please answer yes or no.";;
    esac
done
sleep 2
clear
