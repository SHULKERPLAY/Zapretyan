![Запретян <3](https://github.com/SHULKERPLAY/Zapretyan/blob/main/zapretyanrepo.png)
> Readme is only available in russian

> Обновления репозитория [перестанут выходить вплоть до 2027 года, подробности в патче 1.3](https://github.com/SHULKERPLAY/Zapretyan/releases/tag/1.3)

**Теперь можно пользоваться поиском блокировок интернет ресурсов в РФ из Discord с помощью нашего бота Запретян! (Оригинальная: Zapretyan#2802)** [Посмотрите подробности](https://lunarcreators.ru/zapretyan/app/) или [установите бота на любой свой сервер или к себе на аккаунт из магазина приложений](https://discord.com/discovery/applications/907372459144147035)! *Бота также можно [установить на сервер напрямую](https://discord.com/oauth2/authorize?client_id=907372459144147035&permissions=277025410048&integration_type=0&scope=bot)*

# Запретян / Zapretyan
[![CodeFactor](https://www.codefactor.io/repository/github/shulkerplay/zapretyan/badge/main)](https://www.codefactor.io/repository/github/shulkerplay/zapretyan/overview/main) ![GitHub Release](https://img.shields.io/github/v/release/shulkerplay/zapretyan) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/shulkerplay/zapretyan) ![Discord](https://img.shields.io/discord/683814496942424078?label=Discord) ![YouTube Channel Views](https://img.shields.io/youtube/channel/views/UCWoypHEOaTh6N9zwCtRzr0w) ![Website](https://img.shields.io/website?url=https%3A%2F%2Flunarcreators.ru&link=https%3A%2F%2Flunarcreators.ru)
![Bot Uptime (30 days)](https://img.shields.io/uptimerobot/ratio/m797417008-25ccd350ca5e2f9624767928?link=m797417008-25ccd350ca5e2f9624767928)

**Вывод новых блокировок ресурсов в Российской Федерации каждый день!**  

Запретян - это набор скриптов работающий на Debian/Ubuntu, который собирает данные о блокировках интернет ресурсов в РФ и каждый день подробно (или кратко в цифрах) сообщает о изменениях в реестре блокировок за день в Discord с помощью Discord бота!

Запретян создана **для работы с Discord ботом**. Существует [упрощенная версия](https://github.com/SHULKERPLAY/Zapretyan-Lite), посылающаяя сообщения через вебхуки.

 - [Функции](#%D1%84%D1%83%D0%BD%D0%BA%D1%86%D0%B8%D0%B8)
 - [Зависимости](#%D0%B7%D0%B0%D0%B2%D0%B8%D1%81%D0%B8%D0%BC%D0%BE%D1%81%D1%82%D0%B8)
 - [Обновление](#%D0%BE%D0%B1%D0%BD%D0%BE%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5)
   - [Вручную](#%D0%B2%D1%80%D1%83%D1%87%D0%BD%D1%83%D1%8E)
 - [Установка](#%D1%83%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0)
   - [Вручную](#%D0%B8%D0%BB%D0%B8-%D1%83%D1%81%D1%82%D0%B0%D0%BD%D0%B0%D0%B2%D0%BB%D0%B8%D0%B2%D0%B0%D0%B5%D0%BC-%D1%81%D0%B5%D1%80%D0%B2%D0%B8%D1%81-%D0%B2%D1%80%D1%83%D1%87%D0%BD%D1%83%D1%8E)
 - [Дополнительные функции](#%D0%B4%D0%BE%D0%BF%D0%BE%D0%BB%D0%BD%D0%B8%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D1%8B%D0%B5-%D1%84%D1%83%D0%BD%D0%BA%D1%86%D0%B8%D0%B8)
 - [Конфигурация](#%D0%9A%D0%BE%D0%BD%D1%84%D0%B8%D0%B3%D1%83%D1%80%D0%B0%D1%86%D0%B8%D1%8F)
   - [Пример упрощённой конфигурации](#%D0%BF%D1%80%D0%B8%D0%BC%D0%B5%D1%80-%D1%83%D0%BF%D1%80%D0%BE%D1%89%D1%91%D0%BD%D0%BD%D0%BE%D0%B9-%D0%BA%D0%BE%D0%BD%D1%84%D0%B8%D0%B3%D1%83%D1%80%D0%B0%D1%86%D0%B8%D0%B8)
 - [Известные недочёты](#%D0%B8%D0%B7%D0%B2%D0%B5%D1%81%D1%82%D0%BD%D1%8B%D0%B5-%D0%BD%D0%B5%D0%B4%D0%BE%D1%87%D1%91%D1%82%D1%8B)
 - [Настройка постоянного онлайна бота](#%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0-%D0%BF%D0%BE%D1%81%D1%82%D0%BE%D1%8F%D0%BD%D0%BD%D0%BE%D0%B3%D0%BE-%D0%BE%D0%BD%D0%BB%D0%B0%D0%B9%D0%BD%D0%B0-%D0%B1%D0%BE%D1%82%D0%B0)
 - [Прочее](#%D0%BF%D1%80%D0%BE%D1%87%D0%B5%D0%B5)

## Функции
 - Сбор аналитики: Дата и количество блокировок/разбанов
 - Вывод полного списка банов и разбанов из реестра блокировок в разные чаты с
   разными оповещениями, а также краткий вывод в цифрах с помощью собственного бота. Всё зависит от вашей конфигурации
 - Рассчитан на запуск раз в сутки с помощью systemd или Cron.

[Демонстрация и скриншоты](https://lunarcreators.ru/zapretyan)

## Зависимости

 - Debian 12 или Ubuntu 22 (Может заработать и на чуть более старых)
 - wget
 - node.js >= `18.0.0`
 - npm >= `9.0.0`
   - Discord.js `14.16.3` или новее
 - git

## Обновление
Для обновления вручную можно перезаписать все файлы скрипта которые у вас есть. Вам придётся сохранить и вручную вставить старую конфигурацию `shell/config.cfg` чтобы переместить её в новую версию

Чтобы автоматически обновиться **(Работает только если вы не переименовали папки `shell` и `sender`)**

В терминале исполняем

    wget -O- 'https://raw.githubusercontent.com/SHULKERPLAY/Zapretyan/refs/heads/main/zapretyan_update.sh' | bash

Вводим путь до папки Запретян (В которой папки `shell` и `sender`). Скрипт сам сохранит токен бота и часть старой конфигурации. После обновления проверьте файл конфигурации, для сравнения будет сохранён ваш старый файл под названием `config.old`

### Вручную
Перемещаемся в папку запретян с помощью `cd` и сохраняем старую конфигурацию. Если вы давали другие названия папкам внутри, замените их в команде.

    mv sender/config.json sender/config.json.old
    mv shell/config.cfg shell/config.old

Качаем и распаковываем с заменой последний релиз *(Обращу внимание что с версии 1.2 релизы публикуются в архивах GZIP)*

    wget -t 5 -O Zapretyan.tar.gz 'https://github.com/SHULKERPLAY/Zapretyan/releases/download/1.4/zapretyan.tar.gz' && tar -xf Zapretyan.tar.gz && rm Zapretyan.tar.gz

Возвращаем старый токен бота

    rm sender/config.json && mv sender/config.json.old sender/config.json

Готово. Однако вам нужно вручную переместить всё что нужно из файла `config.old` в `config.cfg`.

## Установка

### Супербыстрая установка  
**Вам понадобится Debian 12 или Ubuntu с установленным wget**  

    wget -O- 'https://raw.githubusercontent.com/SHULKERPLAY/Zapretyan/refs/heads/main/service_install.sh' | bash

### Загрузка вручную  
  
Скачайте архив из последнего релиза  

    wget -O zapretyan.tar.gz 'https://github.com/SHULKERPLAY/Zapretyan/releases/download/1.4/zapretyan.tar.gz'

  
Или скачайте архив репозитория  
  

    wget -O zapretyan.zip 'https://github.com/SHULKERPLAY/Zapretyan/archive/refs/heads/main.zip'

  
Распакуйте его  
  
`tar -xf zapretyan.tar`  или `unzip zapretyan.zip`

Для полностью ручной установки читаем пункт **"Или устанавливаем сервис вручную"**

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
 - `online.js` - поддерживает состояние бота всегда в сети с нужным
   статусом, который вы сами можете настроить в файле. 
   
   Запускается c помощью `exec.sh online`
   
 - `sendprivate.js` - Отсылает **ЛИЧНЫЕ** сообщения (Не на сервера). Для
   использования в файл `sender/var/cid` пишется ID пользователя, а в
   `sender/sendprivate.txt` наполнение сообщения
   
   Запускается из `exec.sh sendprivate`

 - `send.js` - Стандартная функция отправки сообщений ботом. В файл
   `sender/var/cid` пишется ID канала в который отправляется сообщение, а
   в `sender/send.txt` наполнение сообщения
   
   Самостоятельно можно запустить из `exec.sh send`

 - `sendembed.js` - Вторая стандартная функция отправки сообщений ботом. В
   файл `sender/var/cid` пишется ID канала в который отправляется
   сообщение, в файл `sender/var/name` пишется наименование поля
   встроенного сообщения, а в `sender/send.txt` наполнение embed сообщения
   
   Самостоятельно можно запустить из `exec.sh sendembed`
   
 - `multiembed.js` - Новая функция для быстрой отправки встроенных сообщений-списков пачкой, не повторяя логин бота каждый раз когда нужно отослать одно сообщение. В файл `sender/var/cid` пишется ID канала в который отправляется сообщение, в файл `sender/var/name` пишется наименование поля встроенного сообщения, а в директорию `sender/send` перемещаются файлы, каждый из которых содержит отдельное сообщение. Скрипт создаёт один логин и заканчивается только когда отправит каждое сообщение из директории по заданым параметрам.
   
   Самостоятельно можно запустить из `exec.sh multiembed`, но не рекомендуется.
   
 - `index.js`, `botstats.js` - Код ядра Запретян на котором работает [наш Discord бот/Приложение](https://lunarcreators.ru/zapretyan/app/), он публичный и установлен на [нашем сервером Discord](https://discord.gg/e2HcXrQ).
   Корректно работает только с `sources=antifilter`, `istotal=true`!

## Конфигурация
### Описание shell/config.cfg
`shdir=/example/shell` - Путь к папке shell этого скрипта. Скрипт исполняет все команды по распаковке и сравнению с полными путями. При автоматической установки эта строчка перезаписывается значением в конце файла

`jsdir=/example/sender` - Путь к папке sender этого скрипта. Скрипт исполняет все команды по отправке сообщений через node при помощи полных путей. При автоматической установки эта строчка перезаписывается значением в конце файла

    bancid=("000000000000000000")
    unbancid=("00000000000000000")
    banipcid=("00000000000000000")
    unbanipcid=("00000000000000000")
    totalcid=("00000000000000000")

`bancid` - id чатов Discord в которые будут выводиться все новые блокировки с прошлого сравнения

`unbancid` - id чатов Discord в которые будут выводиться все снятые блокировки с прошлого сравнения

`banipcid` - id чатов Discord в которые будут выводиться случайные новые ip адреса, заблокированные с прошлого сравнения

`unbanipcid` - id чатов Discord в которые будут выводиться случайные ip адреса, разблокированные с прошлого сравнения

`totalcid` - id чатов Discord в которые будет выводиться сообщение со статистикой сколько доменов и ip адресов было заблокировано/разблокировано всего/сегодня.

Для рассылки в несколько чатов на одном или нескольких серверах, бот должен присутствовать на серверах и иметь доступ к чатом. Файл конфигурации будет выглядеть так:

    bancid=("000000000000000000" "111111111111111111")
    unbancid=("00000000000000000" "111111111111111111")
    banipcid=("00000000000000000" "111111111111111111")
    unbanipcid=("00000000000000000" "111111111111111111")
    totalcid=("00000000000000000" "111111111111111111")

При этом вы можете указать таким образом несколько чатов, и их количество может быть разное для каждой категории

    bancid=("00000" "11111" "22222" "33333")
    unbancid=("00000" "11111" "22222")
    banipcid=("00000" "11111")
    unbanipcid=("00000")
    totalcid=("00000" "11111" "22222" "44444")

> Само собой все числа в кавычках это ID чатов на серверах. В них будет дублироваться весь сгенерированный вывод по очереди, поэтому в зависимости от количества блокировок и чатов, вывод во все чаты будет длиться дольше.

    isban=true
    isunban=true
    isbanip=true
    isunbanip=true
    isunbanip=true

`isban` - отключает любые отправки в чат `bancid`

`isunban` - отключает любые отправки в чат `unbancid`

`isbanip` - отключает любые отправки в чат `banipcid`

`isunbanip` - отключает любые отправки в чат `unbanipcid`

`istotal` - отключает любые отправки в чат `totalcid`

`errorsend=true` - Переключатель вывода сервисных сообщений, например, когда с прошлого дня не произошло никаких изменений

> :orange_book: **В сегодняшнем списке нет новых заблокированых ресурсов!** $errorping

`banclr` - Устанавливает цвет полосы встроенного сообщения для чата `bancid`

`unbanclr` - Устанавливает цвет полосы встроенного сообщения для чата `unbancid`

`unbanipclr` - Устанавливает цвет полосы встроенного сообщения для чата `banipcid`

`unbanipclr` - Устанавливает цвет полосы встроенного сообщения для чата `unbanipcid`

`totalclr` - Устанавливает цвет полосы встроенного сообщения для чата `totalcid`

Указывается в форме `banclr=ff5e5e` - это 6 символов HEX значения нужного цвета.

> Так если мы хотим поставить чистый красный #ff0000 значение будет `banclr=ff0000`

`analytics=true` - Переключатель сбора аналитики. Она **НЕ** выгружается в сеть, собирает в таблицу данные: Дата, кол-во блокировок, кол-во разбанов, всего заблокировано. Сохраняется в `shell/analytics.csv`

`sources=antifilter` - Возможные значения: `antifilter`, `github`
При `antifilter` значения берутся с сервиса [antifilter.download](https://antifilter.download/) и сравниваются чистые текстовые данные. **Не требует ничего и менять его стоит только если он перестал работать.**

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

### Пример упрощённой конфигурации
Так, если, например, вы не хотите подробный список, а хотите одно сообщение со статистикой, ваши настройки будут выглядеть так:

	isban=false
	isunban=false
	isbanip=false
	isunbanip=false
	isunbanip=true
	
	bancid=("000000000000000000")
	unbancid=("00000000000000000")
	banipcid=("00000000000000000")
	unbanipcid=("00000000000000000")
	totalcid=("1322571237284778066")
![istotal=true](https://lunarcreators.ru/wp-content/uploads/2025/11/zapdemo2.webp)

## Известные недочёты

 - [x] ~~Скрипт не рассчитан на мультисерверную конфигурацию, не уверен
       что стану менять это в будущем. Поэтому чтобы отсылать одно
       содержание в несколько чатов сразу, придётся завести
       дополнительную службу~~
 > :tada: **С версии 1.3** произойдёт смена конфигурации которая позволит рассылать сообщения в несколько чатов на любом сервере на котором состоит Запретян!

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
    After=network-online.target
    StartLimitIntervalSec=1000
    StartLimitBurst=10
    
    [Service]
    Restart=on-failure
    RestartSec=60s
    ExecStart=/bin/bash /root/zapretyan/sender/exec.sh online
    
    [Install]
    WantedBy=multi-user.target

Где вместо `/root/zapretyan/sender/exec.sh` вы должны вписать путь к **вашему** расположению скрипта. Если бот крашнется по какой-то причине, то перезапустится через 60 секунд автоматически (Для версии не ниже 1.4.1). Если бот крашнется `StartLimitBurst` раз за `StartLimitIntervalSec` секунд, то попытки перезапустить скрипт прекратятся. Ждёт запуска сети `network-online.target`

**Устанавливаем службу**  

    systemctl enable zapretyanbot.service  
    systemctl start zapretyanbot.service

Поздравляю! С запуском службы и системы бот будет получать настроенный вами статус!

Чтобы перезапустить службу (Например если бот упал в оффлайн)

    systemctl restart zapretyanbot.service

Чтобы полностью отключить этот юнит

    systemctl disable zapretyanbot.service

Настроить сам вывод статуса можно только отредактировав `sender/online.js`
Меняются параметры под `client.user.setPresence({`

Активность меняется в строчке 

    activities: [{ name: `обходе блокировок`, type: ActivityType.Competing }],

[Тут вы сможете найти возможные значения](https://discord-api-types.dev/api/discord-api-types-v10/enum/ActivityType)

Статусы меняются в следующей строке `status: 'online',`

[О статусах в DiscordJS](https://discord.js.org/docs/packages/discord.js/main/PresenceStatus:TypeAlias)

# Прочее

 - [Страница Запретян на нашем сайте](https://lunarcreators.ru/zapretyan)
 - [Страница приложения Запретян на нашем сайте](https://lunarcreators.ru/zapretyan/app)
 - [Бот Запретян в магазине приложений Discord](https://discord.com/discovery/applications/907372459144147035)
 - [Запретян Лайт!](https://github.com/SHULKERPLAY/Zapretyan-Lite)

Буду рад любой поддержке, связаться со мной можно на [нашем сервере Discord](https://discord.gg/e2HcXrQ)