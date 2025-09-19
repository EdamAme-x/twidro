Deno KV を DB として採用する。

"realtime", "ranking:1d", "ranking:3d", "ranking:1w" を "親key" として、 [親key,
index] の形式で運用する。 基本的にはリアルタイム性が求められるため、10 分ごとに
Cron 処理を行う。 ただし、リアルタイムだけは 1 分ごとに行う

以下をスクレイピングする。 label: <url>: 人気度 
A: https://twidouga.net
(https://twidouga.site): 19 
B: https://twivideo.net: 20 
C: https://twiflix.jp: 14
D: https://twiigle.com: 18

リアルタイムは、全サイトのリアルタイムを混合、人気度 x order で order を決める
ランキングは、全サイトのランキングを混合、人気度 x order で order を決める
