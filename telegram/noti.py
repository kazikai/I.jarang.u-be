#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys, re, time, traceback
from pprint import pprint
import telepot
import urllib2
from datetime import date, datetime, timedelta
from bs4 import BeautifulSoup
import pymongo

PORT = 27100 #27017

connection = pymongo.MongoClient("localhost", PORT)
db = connection.test #db
prices  = db.Keywords #collection

#init for test : id, keywords, price
"""
prices.remove();
prices.insert({
	'id':'68399557',
	#"keywords":"dji+마빅+프로+4K",
	'keywords':'dji%20%EB%A7%88%EB%B9%85%20%ED%94%84%EB%A1%9C%204K',
	'stopwords': '배터리 액세서리 악세서리 팩 카드 가방 케이스 RC', #구분자 : space, utf8
	'price':1200000
	})
"""

def sendMessage(user,msg):
	try:
		bot.sendMessage(user,msg)
	except:
		traceback.print_exc(file=sys.stdout)

def getInfo(keyword, stopwords, price, start):
	url = 'https://openapi.naver.com/v1/search/shop.xml?query='+keyword+'&display=100&start='+str(start)
	#url = url.encode('utf-8')
	print url
	request = urllib2.Request( url.encode('utf-8'), headers={'X-Naver-Client-Id':'dJdCUoFXDK_PXuGff36e', 'X-Naver-Client-Secret':'r8RuqNlwCA'})
	contents = urllib2.urlopen(request).read()
	#print contents
	soup = BeautifulSoup(contents, 'html.parser')
	total = int(soup.total.string)
	print total
	cands = []
	try:
		stopwords_parsed = stopwords.split(' ')
	except:
		stopwords_parsed = []

	for item in soup.find_all('item'):
		#print item
		bSkip = False
		title = item.title.string
		for stopword in stopwords_parsed:
			#print title, stopword
			if stopword and title.lower().find(stopword.lower())>-1: # 금지어가 들어가면 제거
				bSkip = True
		if price < int(item.lprice.string): # 목표가보다 크면 제거
			bSkip = True
		if int(item.producttype.string) > 3: # 일반 상품이 아니면 제거
			bSkip = True
		if int(item.lprice.string)<1000: #1000원 미만이면 제거
			bSkip = True
		if not bSkip:
			cands.append( (title, item.link.string, item.image.string, item.lprice.string) )
		#print item.productid.string
	if total>=start+100:
		cands.extend( getInfo(keyword, stopwords, price, start+100) )
	return cands

def crawl():
	for item in prices.find():
		keyword = item['keywords']
		try:
			stopwords = item['stopwords']
		except:
			stopwords = []
		price = int(item['price'])
		id = item['id']
		print id, keyword, stopwords, price
		cands = getInfo(keyword, stopwords, price, 1)
		for i,v in enumerate(cands):
			lprice = v[3]
			title = re.sub('<(.+?)>', '', v[0])+' '+lprice+u'원\n'
			link = v[1]
			print i, title, link, lprice
			sendMessage(id, title+link)

		#print 'total counts:', len(cands)


now=datetime.now()

TOKEN = '319601093:AAFn2pFF_lNhagPkfrk3rWUf-rNkTqQZXRA'
print '[',now,']' #'received token :', TOKEN

bot = telepot.Bot(TOKEN)
pprint( bot.getMe() )

crawl()


