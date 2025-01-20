rsync -avz --delete -e ssh server jberli@lostinzoom.huma-num.fr:cartogame
rsync -avz --delete -e ssh client jberli@lostinzoom.huma-num.fr:cartogame
rsync -avz --delete -e ssh package.json jberli@lostinzoom.huma-num.fr:cartogame

ssh -i ~/.ssh/humanum.pub jberli@lostinzoom.huma-num.fr '
    cd cartogame/
    rm -r dist
    npm run build

    sudo -S systemctl restart nginx
    sudo -S systemctl restart cartogame
    exit
'