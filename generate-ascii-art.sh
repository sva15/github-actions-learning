#!/bin/sh
sudo apt update
sudo apt install cowsay
cowsay -f dragon "Run for cover; I am a DRAGON... RAWR!" >> dragon.txt
grep -i "dragon" dragon.txt
cat dragon.txt
ls -alrths