#!/bin/bash
bashdir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
. $bashdir/config.cfg

#status codes
e0x0='Список сформирован (0x0)'
e0x1='Не найдены вчерашние списки. Новые будут сформированы завтра (0x1)'
e0x2='Ошибка загрузки сегодняшнего списка (0x2)'
e0x3='Нет изменений в списке за сутки (0x3)'

#Download data
if [ "$sources" = "antifilter" ]; then
    rm $shdir/old.txt
    rm $shdir/oldip.txt
    mv $shdir/new.txt $shdir/old.txt
    mv $shdir/newip.txt $shdir/oldip.txt
    wget -t 5 -T 300 -O $shdir/new.txt https://antifilter.download/list/domains.lst
    wget -t 5 -T 300 -O $shdir/newip.txt https://antifilter.download/list/ip.lst
fi
    
if [ "$sources" = "github" ]; then
    wget -t 5 -O $shdir/v2ray.zip https://github.com/Nidelon/ru-block-v2ray-rules/archive/refs/heads/release.zip
    unzip -o $shdir/v2ray.zip -d $shdir/
    $shdir/v2dat unpack geosite -o $shdir/ $shdir/ru-block-v2ray-rules-release/geosite.dat
    $shdir/v2dat unpack geoip -o $shdir/ $shdir/ru-block-v2ray-rules-release/geoip.dat
    rm $shdir/old.txt
    rm $shdir/oldip.txt
    mv $shdir/new.txt $shdir/old.txt
    mv $shdir/geosite_ru-block.txt $shdir/new.txt
    mv $shdir/newip.txt $shdir/oldip.txt
    mv $shdir/geoip_ru-block.txt $shdir/newip.txt
fi

#Make Dirs
mkdir $shdir/msgbuff
mkdir $shdir/msgbuff/banip
mkdir $shdir/msgbuff/unbanip
mkdir $shdir/msgbuff/ban
mkdir $shdir/msgbuff/unban

#Git output marks new banned domains as + and the unbanned ones as - . So script remove the first line of git output and the first character '-' or '+' 
#grep removes first character of the line and tail removes first line of output

git diff $shdir/old.txt $shdir/new.txt | grep ^+ | sed 's/^.//' | tail -n +2 > $shdir/checkone.txt
	echo "**В СПИСОК ОГРАНИЧЕННЫХ РЕСУРСОВ СЕГОДНЯ ПОПАЛИ:**" > $shdir/bansite.txt
	echo "**$qdate**" >> $shdir/bansite.txt
	cat $shdir/checkone.txt >> $shdir/bansite.txt #New Banned Domains
	split -C 3900 $shdir/bansite.txt $shdir/msgbuff/ban/0x
git diff $shdir/old.txt $shdir/new.txt | grep ^- | sed 's/^.//' | tail -n +2 > $shdir/checktwo.txt
	echo "**Удалены из базы данных (Возможно, разблокированы):**" > $shdir/unbansite.txt
	echo "**$qdate**" >> $shdir/unbansite.txt
	cat $shdir/checktwo.txt >> $shdir/unbansite.txt #New Unbanned Domains
	split -C 3900 $shdir/unbansite.txt $shdir/msgbuff/unban/0x
git diff $shdir/oldip.txt $shdir/newip.txt | grep ^+ | sed 's/^.//' | tail -n +2 > $shdir/checkthree.txt
	cat $shdir/checkthree.txt > $shdir/banip.txt #New Banned CIDR
	sort -R $shdir/banip.txt | split -C 3900 - $shdir/msgbuff/banip/0x
git diff $shdir/oldip.txt $shdir/newip.txt | grep ^- | sed 's/^.//' | tail -n +2 > $shdir/checkfour.txt
	cat $shdir/checkfour.txt > $shdir/unbanip.txt #New Unbanned CIDR
	sort -R $shdir/unbanip.txt | split -C 3900 - $shdir/msgbuff/unbanip/0x
    
#Set Vars
send=$jsdir/send.txt
channelid=$jsdir/var/cid
fieldname=$jsdir/var/name
new=$shdir/new.txt
old=$shdir/old.txt
newip=$shdir/newip.txt
oldip=$shdir/oldip.txt
banbytes=$(stat -c%s $shdir/checkone.txt)
bancount=$(wc -l < $shdir/checkone.txt)
unbanbytes=$(stat -c%s $shdir/checktwo.txt)
unbancount=$(wc -l < $shdir/checktwo.txt)
banipbytes=$(stat -c%s $shdir/checkthree.txt)
banipcount=$(wc -l < $shdir/checkthree.txt)
rndipbancnt=$(wc -l < $shdir/msgbuff/banip/0xaa)
unbanipbytes=$(stat -c%s $shdir/checkfour.txt)
unbanipcount=$(wc -l < $shdir/checkfour.txt)
rndipunbancnt=$(wc -l < $shdir/msgbuff/unbanip/0xaa)
totalbanned=$(wc -l < $shdir/new.txt)
totalipbanned=$(wc -l < $shdir/newip.txt)

#check for errors
if [ -e $shdir/new.txt ]; then
    if [ -e $shdir/old.txt ]; then
        echo -e "$e0x0"
    else
        echo "$bancid" > $channelid
        echo -e "\n *$e0x1* $errorping" > $send
        $jsdir/send.sh
        isban=false
        isunban=false
        analytics=false
    fi
else
        echo "$bancid" > $channelid
        echo -e "\n *$e0x2* $errorping" > $send
        $jsdir/send.sh
        isban=false
        isunban=false
        analytics=false
fi
#
if [ -e $shdir/newip.txt ]; then
    if [ -e $shdir/oldip.txt ]; then
        echo -e "$e0x0"
    else
        echo "$banipcid" > $channelid
        echo -e "\n *$e0x1* $errorping" > $send
        $jsdir/send.sh
        isbanip=false
        isunbanip=false
    fi
else
        echo "$banipcid" > $channelid
        echo -e "\n *$e0x2* $errorping" > $send
        $jsdir/send.sh
        isbanip=false
        isunbanip=false
fi

sleep 2
chmod 777 $shdir/*
sleep 2

#data collecting v1.0
#Date;banned;unbanned;total
if [ "$analytics" = true ]; then
    if [ "$banbytes" -le "2" ]; then
        bancount=0
    fi
    if [ "$unbanbytes" -le "2" ]; then
        unbancount=0
    fi
    echo -e "$csvdate ; $bancount ; $unbancount ; $totalbanned" >> $shdir/analytics.csv
fi

#Send List of new domain Bans
if [ "$isban" = true ]; then
echo "Заблокированые сегодня домены" > $fieldname
echo "$bancid" > $channelid
if [ "$banbytes" -le "2" ]; then
    if [ "$errorsend" = true ]; then
        echo -e "\n *В сегодняшнем списке нет новых заблокированых ресурсов... Скорее всего, это ошибка. Но кто знает...* $errorping" > $send
        $jsdir/send.sh && sleep 2
    else
        sleep 2
    fi
else
	for file1 in $shdir/msgbuff/ban/*
		do
		cat "$file1" > $send && $jsdir/sendembed.sh && sleep 2
		done
	echo -e "**:fire: Сегодня заблокировано доменов:__ $bancount __!** \n :no_entry_sign: Всего заблокировано:__ $totalbanned __" > $send
	$jsdir/send.sh && sleep 2
fi
fi

#Unban check
if [ "$isunban" = true ]; then
echo "Разблокированые сегодня домены" > $fieldname
echo "$unbancid" > $channelid
if [ "$unbanbytes" -le "2" ]; then
	if [ "$errorsend" = true ]; then
        echo -e "\n *Никого не разблокировали... Скорее всего, это ошибка. Но кто знает...* $errorping" > $send
        $jsdir/send.sh && sleep 2
    else
        sleep 2
    fi
else
    #Send Unban List
    for file2 in $shdir/msgbuff/unban/*
        do
        cat "$file2" > $send && $jsdir/sendembed.sh && sleep 2
        done
echo -e "**:large_blue_diamond: Сегодня разблокировано доменов:__ $unbancount __! :large_blue_diamond:**" > $send
$jsdir/send.sh && sleep 2
fi
fi

#Send today's CIDR banlist
if [ "$isbanip" = true ]; then
    if [ "$sources" = "antifilter" ]; then
        echo "Заблокированые сегодня IP адреса" > $fieldname
    fi
    if [ "$sources" = "github" ]; then
        echo "Заблокированые сегодня наборы адресов" > $fieldname
    fi
echo "$banipcid" > $channelid
if [ "$banipbytes" -le "2" ]; then
    if [ "$errorsend" = true ]; then
        if [ "$sources" = "antifilter" ]; then
            echo -e "*В сегодняшнем списке нет новых заблокированых IP адресов... Скорее всего, это ошибка. Но кто знает...*  $errorping" > $send
        fi
        if [ "$sources" = "github" ]; then
            echo -e "*В сегодняшнем списке нет новых заблокированых наборов адресов... Скорее всего, это ошибка. Но кто знает...*  $errorping" > $send
        fi
        $jsdir/send.sh && sleep 2
    else
        sleep 2
    fi
else
    if [ "$sources" = "antifilter" ]; then
        echo "**СПИСОК СЛУЧАЙНЫХ__ $rndipbancnt __ ЗАБЛОКИРОВАНЫХ СЕГОДНЯ IP АДРЕСОВ:**" > $send
    fi
    if [ "$sources" = "github" ]; then
        echo "**СПИСОК СЛУЧАЙНЫХ__ $rndipbancnt __ ЗАБЛОКИРОВАНЫХ СЕГОДНЯ CIDR:**" > $send
    fi
	echo "**$qdate**" >> $send
	cat $shdir/msgbuff/banip/0xaa >> $send && $jsdir/sendembed.sh
	sleep 5
    if [ "$sources" = "antifilter" ]; then
        echo -e "**:x: Заблокировано IP адресов:__ $banipcount __!** \n :anger: Всего заблокировано:__ $totalipbanned __" > $send
    fi
    if [ "$sources" = "github" ]; then
        echo -e "**:x: Обновлено CIDR записей:__ $banipcount __!** \n :anger: Всего заблокировано:__ $totalipbanned __" > $send
    fi
	$jsdir/send.sh && sleep 2
fi
fi

#Unban Check
if [ "$isunbanip" = true ]; then
if [ "$sources" = "antifilter" ]; then
    echo "Разблокированые сегодня IP адреса" > $fieldname
fi
if [ "$sources" = "github" ]; then
    echo "Разблокированые сегодня наборы адресов" > $fieldname
fi
echo "$unbanipcid" > $channelid
if [ "$unbanipbytes" -le "2" ]; then
    if [ "$errorsend" = true ]; then
        if [ "$sources" = "antifilter" ]; then
            echo -e "*В сегодняшнем списке нет разблокированых IP адресов... Скорее всего, это ошибка. Но кто знает...*  $errorping" > $send
        fi
        if [ "$sources" = "github" ]; then
            echo -e "*В сегодняшнем списке нет разблокированых CIDR... Скорее всего, это ошибка. Но кто знает...*  $errorping" > $send
        fi
        $jsdir/send.sh && sleep 2
    else
        sleep 2
    fi
else
	#Send CIDR unban List
    if [ "$sources" = "antifilter" ]; then
        echo "**Случайные__ $rndipunbancnt __ IP адресов, удалённые из базы данных (Возможно, разблокированые):**" > $send
    fi
    if [ "$sources" = "github" ]; then
        echo "**Случайные__ $rndipunbancnt __ CIDR, удалённые из базы данных (Возможно, разблокированые):**" > $send
    fi
	echo "**$qdate**" >> $send
	cat $shdir/msgbuff/unbanip/0xaa >> $send && $jsdir/sendembed.sh && sleep 2
    if [ "$sources" = "antifilter" ]; then
        echo -e "**:green_circle: Сегодня разблокировано__ $unbanipcount __ IP адресов! :green_circle:**" > $send
    fi
    if [ "$sources" = "github" ]; then
        echo -e "**:green_circle: Сегодня разблокировано__ $unbanipcount __ CIDR! :green_circle:**" > $send
    fi
	$jsdir/send.sh && sleep 2
fi
fi
  
#Cleanup
rm $shdir/v2ray.zip
rm $shdir/checkone.txt
rm $shdir/checktwo.txt
rm $shdir/checkthree.txt
rm $shdir/checkfour.txt
rm $shdir/bansite.txt
rm $shdir/unbansite.txt
rm $shdir/banip.txt
rm $shdir/unbanip.txt
rm -rf $shdir/ru-block-v2ray-rules-release/
rm -rf $shdir/msgbuff/
