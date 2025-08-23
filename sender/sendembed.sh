nodedir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
echo '0x724fff' > $nodedir/var/clr
node $nodedir/sendembed.js
