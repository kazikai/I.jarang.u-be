#!/usr/bin/python
# coding=utf-8
import sys
import time
import sqlite3
import telepot
from pprint import pprint
from datetime import date, datetime
import re
import traceback

#ROOT = './'

def sendMessage(id, msg):
    try:
        bot.sendMessage(id, msg)
    except:
        print str(datetime.now()).split('.')[0]
        traceback.print_exc(file=sys.stdout)

def help(id):
    sendMessage(id, """Hacking price 봇입니다.
최저가로 검색하려면 링크를 클릭하세요.
http://139.162.71.151/search.html?id=%s
"""%id)

def handle(msg):
    content_type, chat_type, chat_id = telepot.glance(msg)
    if content_type != 'text':
        sendMessage(chat_id, '난 텍스트 이외의 메시지는 처리하지 못해요.')
        return
    #pprint(msg["from"])
    try:
        name = msg["from"]["last_name"] + msg["from"]["first_name"]
    except:
        name = ""

    text = msg['text'].lower()

    args = text.split(' ')
    if text.startswith('/'):
        if text.startswith('/unsub'):
            #try to unsub
            pass
        else:
            help(chat_id)
    else:
        help(chat_id)
"""

TOKEN = '319601093:AAFn2pFF_lNhagPkfrk3rWUf-rNkTqQZXRA'

bot = telepot.Bot(TOKEN)
pprint( bot.getMe() )

bot.message_loop(handle)

print 'Listening...'

while 1:
    time.sleep(10)