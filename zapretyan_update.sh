#!/bin/bash
bashdir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
echo 'Enter absolute path where zapretyan folders are installed'
echo 'It needed for saving current config'
echo 'e.g. /root/zapretyan'
read -r installpath

echo -e "Im in $bashdir"
echo 'Script uses relative paths - Checking files'
if [ -e $installpath/sender/send.js ]; then
    echo Found JS sender
    if [ -e $installpath/shell/discordrkn.sh ]; then
        echo Found shell files
    else
        echo -e "ERROR. CANNOT FIND $installpath/shell/discordrkn.sh . Aborting..."
        exit 1
    fi
else
    echo -e "ERROR. CANNOT FIND $installpath/sender/send.js . Aborting..."
    exit 1
fi
echo Check complete
sleep 2
clear

. $installpath/shell/config.cfg
cd $installpath

echo 'Saving old configs'
rm -f shell/config.old
mv sender/config.json sender/config.json.old
mv shell/config.cfg shell/config.old

echo 'Downloading package'
wget -t 5 -O Zapretyan.tar.gz 'https://github.com/SHULKERPLAY/Zapretyan/releases/download/1.2.1/zapretyan.tar.gz' && tar -xf Zapretyan.tar.gz && rm Zapretyan.tar.gz

echo 'Restoring bot token'
rm sender/config.json && mv sender/config.json.old sender/config.json

echo 'Restoring some values from old config'
echo -e "#AUTOCONFIG. REMOVE LINES BELOW TO EDIT SAME VARIABLES ABOVE" >> shell/config.cfg
echo -e "shdir=$shdir" >> shell/config.cfg
echo -e "jsdir=$jsdir" >> shell/config.cfg
echo -e "errorping=$errorping" >> shell/config.cfg
echo -e "bancid=$bancid" >> shell/config.cfg
echo -e "unbancid=$unbancid" >> shell/config.cfg
echo -e "banipcid=$banipcid" >> shell/config.cfg
echo -e "unbanipcid=$unbanipcid" >> shell/config.cfg
echo 'RESTORED: DIRS, PING IDs, CIDs'

echo -e "\n\n\nDone! Please edit $installpath/shell/config.cfg to match your needs\nOld config can be found in $installpath/shell/config.old\nRead changelog to check config syntax changes"