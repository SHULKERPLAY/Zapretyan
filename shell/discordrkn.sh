#!/bin/bash

#Path to shell scripts and temp files directory
shdir=/root/lunarcontroller

#Path to discord javascript files directory
jsdir=/root/discord-RKN

#Date variable e.g 24/02/25
qdate=$(date +%d/%m/%y)

#Download And Sort
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
mkdir $shdir/msgbuff
mkdir $shdir/msgbuff/banip
mkdir $shdir/msgbuff/unbanip
mkdir $shdir/msgbuff/ban
mkdir $shdir/msgbuff/unban
comm -13 <(sort -d $shdir/old.txt) <(sort -d $shdir/new.txt) > $shdir/checkone.txt
	echo "**В СПИСОК ОГРАНИЧЕННЫХ РЕСУРСОВ СЕГОДНЯ ПОПАЛИ:**" > $shdir/bansite.txt
	echo "**$qdate**" >> $shdir/bansite.txt
	comm -13 <(sort -d $shdir/old.txt) <(sort -d $shdir/new.txt) >> $shdir/bansite.txt #New Banned Domains
	split -C 3900 $shdir/bansite.txt $shdir/msgbuff/ban/0x
comm -23 <(sort -d $shdir/old.txt) <(sort -d $shdir/new.txt) > $shdir/checktwo.txt
	echo "**Удалены из базы данных (Возможно, разблокированны):**" > $shdir/unbansite.txt
	echo "**$qdate**" >> $shdir/unbansite.txt
	comm -23 <(sort -d $shdir/old.txt) <(sort -d $shdir/new.txt) >> $shdir/unbansite.txt #New Unbanned Domains
	split -C 3900 $shdir/unbansite.txt $shdir/msgbuff/unban/0x
comm -13 <(sort -d $shdir/oldip.txt) <(sort -d $shdir/newip.txt) > $shdir/checkthree.txt
	comm -13 <(sort -d $shdir/oldip.txt) <(sort -d $shdir/newip.txt) > $shdir/banip.txt #New Banned CIDR
	sort -R $shdir/banip.txt | split -C 3900 - $shdir/msgbuff/banip/0x
comm -23 <(sort -d $shdir/oldip.txt) <(sort -d $shdir/newip.txt) > $shdir/checkfour.txt
	comm -23 <(sort -d $shdir/oldip.txt) <(sort -d $shdir/newip.txt) > $shdir/unbanip.txt #New Unbanned CIDR
	sort -R $shdir/unbanip.txt | split -C 3900 - $shdir/msgbuff/unbanip/0x
sleep 5
chmod 777 $shdir/*
sleep 5

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

#Send List of new domain Bans
echo "Заблокированные сегодня домены" > $fieldname
echo "1321886098607050984" > $channelid
if [ "$banbytes" -le "2" ]; then
	echo -e "\n *В сегодняшнем списке нет новых заблокированных ресурсов... Скорее всего, это ошибка. Но кто знает...* <@&683823927851614242>" > $send
	$jsdir/send.sh && sleep 2
else
	for file1 in $shdir/msgbuff/ban/*
		do
		cat "$file1" > $send && $jsdir/sendembed.sh && sleep 2
		done
	echo -e "**:fire: Сегодня заблокированно доменов:__ $bancount __!** \n :no_entry_sign: Всего заблокированно:__ $totalbanned __" > $send
	$jsdir/send.sh && sleep 2
fi
#Unban check
echo "Разблокированные сегодня домены" > $fieldname
echo "1322551019162308699" > $channelid
if [ "$unbanbytes" -le "2" ]; then
	echo -e "\n *Никого не разблокировали... Скорее всего, это ошибка. Но кто знает...* <@&683823927851614242>" > $send
	$jsdir/send.sh && sleep 2
	else
		#Send Unban List
		for file2 in $shdir/msgbuff/unban/*
			do
			cat "$file2" > $send && $jsdir/sendembed.sh && sleep 2
			done
echo -e "**:large_blue_diamond: Сегодня разблокированно доменов:__ $unbancount __! :large_blue_diamond:**" > $send
$jsdir/send.sh && sleep 2
fi

#Send today's CIDR banlist
echo "Заблокированные сегодня наборы адресов" > $fieldname
echo "1322551051244539964" > $channelid
if [ "$banipbytes" -le "2" ]; then
	echo -e "*В сегодняшнем списке нет новых заблокированных наборов адресов... Скорее всего, это ошибка. Но кто знает...*  <@&683823927851614242>" > $send
	$jsdir/send.sh && sleep 2
else
	echo "**СПИСОК СЛУЧАЙНЫХ__ $rndipbancnt __ ЗАБЛОКИРОВАННЫХ СЕГОДНЯ CIDR:**" > $send
	echo "**$qdate**" >> $send
	cat $shdir/msgbuff/banip/0xaa >> $send && $jsdir/sendembed.sh
	sleep 5
	echo -e "**:x: Обновлено CIDR записей:__ $banipcount __!** \n :anger: Всего заблокировано:__ $totalipbanned __" > $send
	$jsdir/send.sh && sleep 2
fi
#Unban Check
echo "Разблокированные сегодня наборы адресов" > $fieldname
echo "1322551086178893876" > $channelid
if [ "$unbanipbytes" -le "2" ]; then
	echo -e "*В сегодняшнем списке нет разблокированных CIDR... Скорее всего, это ошибка. Но кто знает...*  <@&683823927851614242>" > $send
	$jsdir/send.sh && sleep 2
else
	#Send CIDR unban List
	echo "**Случайные__ $rndipunbancnt __ CIDR, удалённые из базы данных (Возможно, разблокированные):**" > $send
	echo "**$qdate**" >> $send
	cat $shdir/msgbuff/unbanip/0xaa >> $send && $jsdir/sendembed.sh && sleep 2
	echo -e "**:green_circle: Сегодня разблокированно__ $unbanipcount __ CIDR! :green_circle:**" > $send
	$jsdir/send.sh && sleep 2
fi       
#Cleanup
rm $shdir/v2ray.zip
rm $shdir/checkone.txt
rm $shdir/checktwo.txt
rm $shdir/checkthree.txt
rm $shdir/checkfour.txt
rm -rf $shdir/ru-block-v2ray-rules-release/
rm -rf $shdir/msgbuff/
