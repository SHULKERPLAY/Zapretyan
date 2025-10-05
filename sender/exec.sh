nodedir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $nodedir
if [ "$1" = "index" ]; then
node index.js && exit
fi
if [ "$1" = "multiembed" ]; then
node multiembed.js && exit
fi
if [ "$1" = "online" ]; then
node online.js && exit
fi
if [ "$1" = "send" ]; then
node send.js && exit
fi
if [ "$1" = "sendembed" ]; then
node sendembed.js && exit
fi
if [ "$1" = "sendprivate" ]; then
node sendprivate.js && exit
fi
echo 'Possible args: index, multiembed, online, send, sendembed, sendprivate.'