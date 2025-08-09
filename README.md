![Запретян <3](https://github.com/SHULKERPLAY/Zapretyan/blob/Zapretyan/zapretyanrepo.png)
> Readme is only available in russian

# Запретян / Zapretyan
[![CodeFactor](https://www.codefactor.io/repository/github/shulkerplay/zapretyan/badge/main)](https://www.codefactor.io/repository/github/shulkerplay/zapretyan/overview/main) ![GitHub Release](https://img.shields.io/github/v/release/shulkerplay/zapretyan) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/shulkerplay/zapretyan) ![Discord](https://img.shields.io/discord/683814496942424078?label=Discord) ![YouTube Channel Views](https://img.shields.io/youtube/channel/views/UCWoypHEOaTh6N9zwCtRzr0w) 
**Вывод новых блокировок ресурсов в Российской Федерации каждый день!**  

Запретян - это набор скриптов работающий на Debian/Ubuntu, который собирает данные о блокировках и сравнивает их с предыдущими сохранёнными данными.  

## Функции
 - Сбор аналитики: Дата и количество блокировок/разбанов
 - Вывод полного списка нововведений реестра блокировок в разные чаты с
   разными оповещениями с помощью собственного бота. Всё зависит от
   вашей конфигурации
 - Рассчитан на запуск раз в сутки с помощью systemd или Cron.

## Зависимости

 - Debian 12 или новее (О совместимости с Ubuntu неизвестно, только
   пробовать...)
 - wget
 - node.js >= `18.0.0`
 - npm >= `9.0.0`
 - git

## Установка

### Супербыстрая установка  
**Вам понадобится Debian 12 или Ubuntu с установленным wget**  

    wget -O- 'https://raw.githubusercontent.com/SHULKERPLAY/Zapretyan/refs/heads/main/service_install.sh' | bash

### Загрузка вручную  
  
Скачайте архив из последнего релиза  

    wget -O zapretyan.tar 'https://ждёмрелиз'

  
Или скачайте архив репозитория  
  

    wget -O zapretyan.zip 'https://github.com/SHULKERPLAY/Zapretyan/archive/refs/heads/main.zip'

  
Распакуйте его  
  
`tar -xf zapretyan.tar`  или `unzip zapretyan.zip`
  
Для автоматической настройки системного юнита и зависимостей запустите с повышенными привилегиями `service_install.sh` и следуйте инструкциям  

    sudo ./service_install.sh 

Добавляем токен своего Discord бота через которого будет идти общение с Discord. Редактируем sender/config.json в папке установки и вставляем в него свой токен  

    {
    	"token": "L4WvKZD9fechFW825IbfA0R4iycOASe6xPDwXB9OFv715T179vMlMl2D3WjrUVBF"
    }  
    // Это не настоящий токен. Не пытайтесь =)
    
**И не забудьте поменять [конфигурацию в shell/config.cfg](https://github.com/SHULKERPLAY/Zapretyan/tree/main?tab=readme-ov-file#%D0%BA%D0%BE%D0%BD%D1%84%D0%B8%D0%B3%D1%83%D1%80%D0%B0%D1%86%D0%B8%D1%8F).** А именно настройте опции `bancid`, `unbancid`, `banipcid`, `unbanipcid` и `errorping` по своему усмотрению

### Или устанавливаем сервис вручную

Устанавливаем зависимости

    apt update && apt install npm nodejs git wget -y

Создаём директорию в которой будет работать запретян. И ложим туда папки shell и sender  
Например  

    mkdir /root/zapretyan
    mv sender /root/zapretyan/sender 
    mv shell /root/zapretyan/shell 
 
Далее редактируем конфигурацию. Она лежит в shell/config.cfg

    nano /root/zapretyan/shell/config.cfg

В переменную shdir пишем полный путь до папки shell  
  

    shdir=/root/zapretyan/shell 

 
  
В переменную jsdir пишем полный путь до папки sender  
  

    jsdir=/root/zapretyan/sender  

  
Далее вписываем ID нужных каналов и сохраняем файл. Подробная инструкция по конфигу есть ниже.  
  
Добавляем токен своего Discord бота через которого будет идти общение с Discord. Редактируем sender/config.json и вставляем в него свой токен  

    {
    	"token": "L4WvKZD9fechFW825IbfA0R4iycOASe6xPDwXB9OFv715T179vMlMl2D3WjrUVBF"
    }  
    // Это не настоящий токен. Не пытайтесь =)

**Устанавливаем модуль Discord.js, совместимый со скриптом**

> **В папке sender должна быть папка node_modules с Discord.js**

Заходим в папку sender
`cd sender`

Скачиваем архив
`wget -t 5 -O node.tar 'https://www.dropbox.com/scl/fi/6ug26cl0h5bx8vfrgr2kf/node_modules.tar?rlkey=dpr2vqn2hbeqrzm0d20ikxjf7&e=2&st=llm6v7x8&dl=1'`

Распаковываем
`tar -xf node.tar`

 Удаляем если появилась папка node_modules
`rm node.tar`

И можно переходить далее
**Или устанавливаем последний доступный**
> Репозиторий работал в связке с Discord.js `14.16.3`

    cd sender

Устанавливаем Discord.js

    npm install discord.js

После этого он должен работать. DiscordJS очень часто обновляется, поэтому не могу гарантировать что он никогда не сломает этот скрипт.

*Возможно вам понадобится версия node новее чем 18. Для обновления NodeJS вам, вероятнее всего, придётся использовать fnm*
Ставим зависимости

    apt install curl unzip

Ставим fnm

    wget -O- https://fnm.vercel.app/install | bash

Обновляем переменные оболочки
`source /root/.bashrc` *(или папка вашего пользователя вместо root)*

После этого для установки node 24.x.x вводим

    fnm install 24
И можно переходить далее

**Не забудьте поменять [конфигурацию в shell/config.cfg](https://github.com/SHULKERPLAY/Zapretyan/tree/main?tab=readme-ov-file#%D0%BA%D0%BE%D0%BD%D1%84%D0%B8%D0%B3%D1%83%D1%80%D0%B0%D1%86%D0%B8%D1%8F).** А именно настройте опции `bancid`, `unbancid`, `banipcid`, `unbanipcid` и `errorping` по своему усмотрению

Теперь делаем так, чтобы наш бот **включался каждый день**. Главный исполнительный скрипт - `shell/discordrkn.sh`, который нужно исполнять автоматически каждый день.  
  

 - Это можно сделать с помощью Cron (*С чем я вам определённо не помогу
   и вам нужно будет искать гайды по крону в интернете...*)
   
 - Или с помощью **системного таймера**. Рассмотрим этот вариант

  
**Создаём системную службу**  

    touch /etc/systemd/system/zapretyan.service  
    nano /etc/systemd/system/zapretyan.service  

И записываем в неё строки ниже:  
  

    [Unit]
    Description=Zapretyan - Russia internet bans notifier
    
    [Service]
    ExecStart=/bin/bash /root/zapretyan/shell/discordrkn.sh

  
Где вместо `/root/zapretyan/shell/discordrkn.sh` вы должны вписать путь к **вашему** расположению скрипта  
  
Нам не нужно устанавливать это как службу, поэтому просто сохраняем файл.
  
**Создаём системный таймер.** Именно он будет запускаться с системой и триггерить каждый день сервис написанный нами выше  
  
    touch /etc/systemd/system/zapretyan.timer  
    nano /etc/systemd/system/zapretyan.timer  

И вписываем эти строки  

    [Unit]
    Description=Trigger for Zapretyan - Russia internet bans notifier
    
    [Timer]
    Persistent=true
    OnCalendar=Mon..Sun *-*-* 08:00:00
    
    [Install]
    WantedBy=timers.target

Где время меняем на собственное или оставляем это. По стандарту наша служба запускается раз в день в 08:00:00  
  
**Устанавливаем таймер**  

    systemctl enable zapretyan.timer  
    systemctl start zapretyan.timer  

  
Поздравляем! У вас есть рабочая служба  
  
Остановить её можно с помощью `systemctl disable zapretyan.timer`  
Если вы захотите редактировать время в которое запускается скрипт, **поменяйте значение в таймере и напишите:**  

    systemctl daemon-reload  

  
*Аналогичным способом можно создавать и другие системные сервисы, просто меняя имя службы и путь к скрипту*  
  

## Дополнительные функции
В файлах sender вложены дополнительные функции  
 - `index.js` - поддерживает состояние бота всегда в сети с нужным
   статусом, который вы сами можете настроить в файле. 
   
   Запускается из `index.sh`
   
 - `sendprivate.js` - Отсылает **ЛИЧНЫЕ** сообщения (Не на сервера). Для
   использования в файл `sender/var/cid` пишется ID пользователя, а в
   `sender/sendprivate.txt` наполнение сообщения
   
   Запускается из `sendprivate.sh`

 - `send.js` - Стандартная функция отправки сообщений ботом. В файл
   `sender/var/cid` пишется ID канала в который отправляется сообщение, а
   в `sender/send.txt` наполнение сообщения
   
   Самостоятельно можно запустить из `send.sh`

 - `sendembed.js` - Вторая стандартная функция отправки сообщений ботом. В
   файл `sender/var/cid` пишется ID канала в который отправляется
   сообщение, в файл `sender/var/name` пишется наименование поля
   встроенного сообщения, а в `sender/send.txt` наполнение embed сообщения
   
   Самостоятельно можно запустить из `sendembed.sh`

## Конфигурация
### Описание shell/config.cfg
`shdir=/example/shell` - Путь к папке shell этого скрипта. Скрипт исполняет все команды по распаковке и сравнению с полными путями. При автоматической установки эта строчка перезаписывается значением в конце файла

`jsdir=/example/sender` - Путь к папке sender этого скрипта. Скрипт исполняет все команды по отправке сообщений через node при помощи полных путей. При автоматической установки эта строчка перезаписывается значением в конце файла

    bancid=000000000000000000
    unbancid=00000000000000000
    banipcid=00000000000000000
    unbanipcid=00000000000000000

`bancid` - id чата Discord в который будут выводиться все новые блокировки с прошлого сравнения
`unbancid` - id чата Discord в который будут выводиться все снятые блокировки с прошлого сравнения
`banipcid` - id чата Discord в который будут выводиться случайные новые ip адреса, заблокированные с прошлого сравнения
`unbanipcid` - id чата Discord в который будут выводиться случайные ip адреса, разблокированные с прошлого сравнения

    isban=true
    isunban=true
    isbanip=true
    isunbanip=true

`isban` - отключает любые отправки в чат `bancid`
`isunban` - отключает любые отправки в чат `unbancid`
`isbanip` - отключает любые отправки в чат `banipcid`
`isunbanip` - отключает любые отправки в чат `unbanipcid`

`errorsend=true` - Переключатель вывода сервисных сообщений, например, когда с прошлого дня не произошло никаких изменений

> :orange_book: **В сегодняшнем списке нет новых заблокированых ресурсов!** $errorping

`analytics=true` - Переключатель сбора аналитики. Она не выгружается в сеть, собирает в таблицу данные: Дата, кол-во блокировок, кол-во разбанов, всего заблокировано. Сохраняется в `shell/analytics.csv`

`sources=antifilter` - Возможные значения: `antifilter`, `github`
При `antifilter` значения берутся с сервиса [antifilter.download](https://antifilter.download/) и сравниваются чистые текстовые данные. Не требует ничего и менять его стоит только если он перестал работать.

При `github` применяется старая система сравнения. Данные берутся из [Nidelon/ru-block-v2ray-rules](https://github.com/Nidelon/ru-block-v2ray-rules). Надежда была на то, что если antifilter прекратит свою работу, а я не смогу поддерживать этот репозиторий, то с малой долей вероятности этот репозиторий перейдёт на экспорт данных из другого места и скрипт сможет работать без переработки. Это устаревший метод, но я решил его оставить.
Во избежании ошибок, при переключении на `github` удалите в папке shell файлы `newip.txt` и `oldip.txt`
Для его использования используется скомпилированный бинарный файл распаковщика dat файлов [urlesistiana/v2dat](https://github.com/urlesistiana/v2dat). Поэтому для того чтобы использовать метод `github` вам нужен файл v2dat в папке shell. 

    cd shell
    wget -t 5 -O v2dat 'https://github.com/SHULKERPLAY/Zapretyan/raw/refs/heads/main/bin/v2dat'

`errorping='<@&000000000000000>'` - Содержит пинг участника или роли при выводе сервисных сообщений. Оставьте `errorping=' '` чтобы отключить упоминания. У Discord пинги имеют форму:
Для пользователей - `<@idПользователя>`
Для ролей - `<@&idРоли>`
Также вы можете оставить несколько пингов в это значение 
`errorping='<@459657842895486977> <@&683823927851614242>'` 
> :orange_book: **В сегодняшнем списке нет новых заблокированых ресурсов!** @Шалкер~<3 @Разработчик

`qdate=$(date +%d/%m/%y)` - Системная команда Linux собирающая дату в форме `08/08/25`
Отображается в шапке первого встроенного сообщения со списком. Не вижу сценариев в которых это нужно было бы менять.

> **В СПИСОК ОГРАНИЧЕННЫХ РЕСУРСОВ СЕГОДНЯ ПОПАЛИ:
08/08/25**

`csvdate=$(date +%d.%m.%Y)` - Системная команда Linux собирающая дату в форме `28.06.2025`
Выводится в первом столбце таблицы `shell/analytics.csv`. Не вижу сценариев в которых это нужно было бы менять.

    date;banned;unbanned;total
    21.05.2025 ; 1667 ; 118 ; 831954
    22.05.2025 ; 1772 ; 95 ; 833631
    23.05.2025 ; 1573 ; 47 ; 835157

## Известные недочёты

 - [ ] Скрипт не рассчитан на мультисерверную конфигурацию, не уверен
       что стану менять это в будущем. Поэтому чтобы отсылать одно
       содержание в несколько чатов сразу, придётся завести
       дополнительную службу

 - [ ] Скрипт не будет отправлять сообщения в Discord на территории РФ.
       Тут тоже ничего не сделать, РКН блокирует запросы к API Discord,
       вы просто будете ловить тайм-аут. Поэтому машина должна быть вне
       РФ

 - [ ] Заблокированные IP адреса выводятся случайным списком, который
       подстраивается под максимальный размер сообщения, одним
       сообщением каждый день, и не собираются в аналитике. Проблема в
       том, что каждый день происходят огромные ротации бан/разбан для
       адресов, и выводить каждый день огромную кучу сообщений которые
       технически не дают нам никакой полезной информации будет
       нелогично. Для своего интереса полный список заблокированных IP
       адресов вы можете посмотреть в `shell/banip.txt`

## Настройка постоянного онлайна бота
*Если вы хотите чтобы ваш бот поддерживал постоянный статус пока ваш сервер работает.*

**Создаём системную службу**  

    touch /etc/systemd/system/zapretyanbot.service  
    nano /etc/systemd/system/zapretyanbot.service  

И записываем в неё строки ниже:

    [Unit]
    Description=Discord bot status daemon
    [Service]
    ExecStart=/bin/bash /root/zapretyan/sender/index.sh
    [Install]
    WantedBy=multi-user.target

Где вместо `/root/zapretyan/sender/index.sh` вы должны вписать путь к **вашему** расположению скрипта

**Устанавливаем службу**  

    systemctl enable zapretyanbot.service  
    systemctl start zapretyanbot.service

Поздравляю! С запуском службы и системы бот будет получать настроенный вами статус!

Чтобы перезапустить службу (Например если бот упал в оффлайн)

    systemctl restart zapretyanbot.service

Чтобы полностью отключить этот юнит

    systemctl disable zapretyanbot.service

Настроить сам вывод статуса можно только отредактировав `sender/index.js`
Меняются параметры под `client.user.setPresence({`

Активность меняется в строчке 

    activities: [{ name: `обходе блокировок`, type: ActivityType.Competing }],

[Тут вы сможете найти возможные значения](https://discord-api-types.dev/api/discord-api-types-v10/enum/ActivityType)

Статусы меняются в следующей строке `status: 'idle',`
[О статусах в DiscordJS](https://discord.js.org/docs/packages/discord.js/main/PresenceStatus:TypeAlias)

Буду рад любой поддержке, связаться со мной можно на [нашем сервере Discord](https://discord.gg/e2HcXrQ)