#MAYBE IM STUPID BUT THIS WORKS CORRECTLY ONLY IF U CALL INDEX.JS FROM SAME DIRECTORY AS INDEX
#e.g node index.js
#Otherwise bot will return null error trying to resolve an empty answer

#Specify shell dir
shdir=
. $shdir/config.cfg
#params
tempdir=$jsdir/temp
minlength=5
maxlength=255
reqid=$2
index=$shdir/new.txt

#temp cleanup
tempsize=$(ls -A $tempdir | wc -w)
if [ "$tempsize" -gt "100" ]; then
    rm -rf ${tempdir:?}/*
fi

#special chars
if [[ ! "$1" =~ ^[a-zA-Z0-9.-]*$ ]]; then
        echo 'Недопустимый символ в __**'$1'**__.' > $tempdir/$reqid
    exit 1
else
    domain=$(echo $1 | tr '[:upper:]' '[:lower:]')
fi

#length
length=$(echo $domain | wc -m)
if [ "$length" -lt "$minlength" ]; then
    echo 'Минимальная длинна запроса - '$minlength' символов' > $tempdir/$reqid
    exit 1
else
    if [ "$length" -gt "$maxlength" ]; then
        echo 'Минимальная длинна запроса - '$maxlength' символов' > $tempdir/$reqid
        exit 1
    fi
fi

#Resolving
resolve=$(grep $domain $index)

#Count
rescount=$(echo $resolve | wc -w)

#result
if [ "$rescount" -lt "1" ]; then
    echo ':green_heart: __'$domain'__ **не найден** в реестре блокировок РКН!' > $tempdir/$reqid
    exit 0
else
    if [ "$rescount" -lt "6" ]; then
        if [ -z "$(echo "$resolve" | grep -e "^$domain$")"]; then
            match='эти домены'
        else
            match='точное совпадение **`'$domain'`**, все совпадения'
        fi
        echo ':bangbang: Нашла в реестре РКН '$match': __'$(echo "$resolve" | sed ':a;N;$!ba;s/\n/__, __/g')'__.' > $tempdir/$reqid
        exit 0
    else
        firstresult=$(echo $resolve | awk '{print $1}')
        if [ -z "$(echo "$resolve" | grep -e "^$domain$")"]; then
            match='__'$firstresult'__'
        else
            match='точное совпадение **`'$domain'`**'
        fi
        echo ':large_blue_diamond: Нашла в реестре РКН '$match' и ещё **'$(($rescount-1))' доменов**! Измените запрос для получения более точного или объёмного результата.' > $tempdir/$reqid
        exit 0
    fi
fi