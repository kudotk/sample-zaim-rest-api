# Zaim Rest API Sample

## Overview

ZaimのREST API実行サンプルです

## Requirement

* node v10.13.0
* npm 6.4.1

## Install

### 1. Zaim認証ID取得

https://dev.zaim.net/users/login にログイン  
[新しいアプリケーションを追加]で適当に入力  
コンシューマID、コンシューマシークレットをconfig/default.jsonに追記

### 2. ユーザートークン取得

```
$ npm install
$ npm run start
```
ブラウザで http://127.0.0.1 を開く  
OAuthの[認証実行]をクリック  
Zaimの認証画面に移動するので許可する  
完了画面に移動するがリダイレクトされないので、Chrome開発者ツールなどでソースを表示  
div.callbackのURL`http://127.0.0.1:4000/auth/callback?〜`をブラウザで開く  
表示されたtoken、token secretをconfig/default.jsonに追記

## Usage

Install後、`npm run start`で再起動  
ブラウザで http://127.0.0.1 を開き、ユーザー情報の取得、合計金額の取得を実行すると、Zaimに入力しているデータが表示される  

## Reference

* [RubyでZaim APIを利用する](https://qiita.com/seteen/items/12f535228e2a3453764b)
* [GASからZaim APIを利用する](https://qiita.com/shutosg/items/6845057432bca551024b)

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)

----

(c) 2018 kudotk