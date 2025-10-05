nodedir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $nodedir
node $nodedir/sendembed.js
