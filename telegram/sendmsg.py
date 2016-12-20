#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys, time, traceback
import telepot
from pprint import pprint

def sendMessage(user,msg):
	try:
		bot.sendMessage(user,msg)
	except:
		traceback.print_exc(file=sys.stdout)

TOKEN = '319601093:AAFn2pFF_lNhagPkfrk3rWUf-rNkTqQZXRA'

bot = telepot.Bot(TOKEN)
pprint( bot.getMe() )

if len(sys.argv)<3:
	print '2 or more args needed.'
else:
	sendMessage(sys.argv[1], sys.argv[2])
