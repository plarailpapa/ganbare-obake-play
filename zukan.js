import * as THREE from 'three';
import { lang, fmtSpeed, unitLabel } from './i18n.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ENTRIES = [
  { name:'カメ', speed:'{時速|じそく} 1 km', size:'長さ {約|やく} 30 cm', weight:'{約|やく} 3 kg', kind:'glb', src:'turtle.glb',
    desc:'かたい こうらで 体を {守|まも}る、は{虫類|ちゅうるい}の なかまです。{陸|りく}や 川、海など、いろいろな {場所|ばしょ}に すんでいます。',
    mame:['こうらは、せなかの ほねと ろっこつが {変化|へんか}して できた、体の {一部|いちぶ}です。だから、ぬいで はだかに なることは できません。', 'オーストラリアの 川には、おしりで {息|いき}を する カメが います。'] },
  { name:'ニワトリ', speed:'{時速|じそく} 14 km', size:'長さ {約|やく} 45 cm', weight:'{約|やく} 2.5 kg', kind:'glb', src:'chicken.glb',
    desc:'{卵|たまご}や 肉の ために、人が {育|そだ}てて いる 鳥です。東南アジアの 森に すむ、セキショクヤケイという 鳥が {祖先|そせん}と 考えられて います。',
    mame:['鳥は {恐竜|きょうりゅう}の 子そんです。ニワトリも、ティラノサウルスの 遠い 親せきに あたります。', '「3 歩 歩くと わすれる」と 言われますが、本当は なかまの 顔を ちゃんと 見分けて います。'] },
  { name:'はしる ひと', speed:'{時速|じそく} 20 km', size:'{身長|しんちょう} {約|やく} 170 cm', weight:'{約|やく} 60 kg', kind:'glb', src:'runner.glb',
    desc:'2 本の 足で 走る どうぶつです。長い {距離|きょり}を 走りつづける 力は、どうぶつの 中でも トップクラスです。',
    mame:['{世界一|せかいいち} {速|はや}い 人の 100 メートルの {記録|きろく}は 9.58 {秒|びょう}。その 時の {最高|さいこう} {時速|じそく}は {約|やく} 44 km です。', 'イギリスには、人と 馬が 35 km を {競|きそ}う レースが あります。馬に {勝|か}った 人も います。', '{乗|の}り{物|もの}に {乗|の}れば、どの どうぶつよりも {速|はや}いです。自分の 足では ありませんが。'] },
  { name:'スケートボード', speed:'{時速|じそく} 25 km', size:'長さ {約|やく} 80 cm', weight:'{約|やく} 3 kg', kind:'glb', src:'skate.glb',
    desc:'{板|いた}に 4 つの 車りんを つけた {乗|の}り{物|もの}です。足で {地面|じめん}を けって {進|すす}みます。2021 年の 東京オリンピックから {競技|きょうぎ}に なりました。',
    mame:['1950 年代の アメリカで、{波|なみ}の ない 日の サーファーが {遊|あそ}びで {始|はじ}めたと 言われて います。', 'オリンピックの {競技|きょうぎ}なのに、車の 多い {道路|どうろ}で {乗|の}ると {法律|ほうりつ}いはんに なる ことが あります。'] },
  { name:'じてんしゃ', speed:'{時速|じそく} 30 km', size:'長さ {約|やく} 1.7 m', weight:'{約|やく} 15 kg', kind:'glb', src:'bicycle.glb',
    desc:'ペダルを こいで {進|すす}む {乗|の}り{物|もの}です。エンジンが なくても、歩くより ずっと 少ない 力で 遠くまで 行けます。',
    mame:['{自転車|じてんしゃ}の もとに なった 1817 年の ドイツの {乗|の}り{物|もの}には、ペダルが ありませんでした。足で {地面|じめん}を けって {進|すす}みます。', '2018 年に、車の すぐ 後ろに ついて 走る {特別|とくべつ}な {方法|ほうほう}で、{時速|じそく} 296 km を 出した 人が います。'] },
  { name:'ロバ', speed:'{時速|じそく} 40 km', size:'長さ {約|やく} 1.5 m', weight:'{約|やく} 200 kg', kind:'glb', src:'Donkey.glb',
    desc:'馬の なかまで、長い 耳が とくちょうです。{荷物|にもつ}を {運|はこ}ぶ {働|はたら}き{者|もの}として、人と ずっと くらして きました。',
    mame:['鳴き声は {約|やく} 3 km 先まで {届|とど}くと 言われます。', 'ギリシャ{神話|しんわ}の 王さまは、音楽の かみさまを おこらせて、耳を ロバの 耳に {変|か}えられました。これが「王さまの 耳は ロバの 耳」の お話です。ロバは 何も して いません。'] },
  { name:'いぬ', speed:'{時速|じそく} 45 km', size:'長さ {約|やく} 70 cm', weight:'{約|やく} 10 kg', kind:'glb', src:'ShibaInu.glb',
    desc:'1 万年 {以上|いじょう} 前から 人と くらして きた、いちばん 古い 友だちです。オオカミに 近い なかまから 生まれました。',
    mame:['においを かぎ分ける 力は、人の 1 万{倍|ばい} {以上|いじょう}と 言われて います。', '自分の しっぽを {追|お}いかけて、ぐるぐる 回ります。つかまえても、とくに 何も おきません。'] },
  { name:'キツネ', speed:'{時速|じそく} 50 km', size:'長さ {約|やく} 70 cm', weight:'{約|やく} 6 kg', kind:'glb', src:'Fox.glb',
    desc:'森や 野原に すむ、イヌの なかまです。耳が とても よく、雪の 下の ネズミの 音も 聞き分けて つかまえます。',
    mame:['ふさふさの しっぽは、ねる 時の ふとんの かわりにも なります。', 'ゴルフ場の ボールを {持|も}って いきます。カナダには、「キツネに とられたら、ばつなしで {置|お}き直して よい」と ルールに 書いた ゴルフ場が あります。'] },
  { name:'うま', speed:'{時速|じそく} 60 km', size:'長さ {約|やく} 2.4 m', weight:'{約|やく} 500 kg', kind:'glb', src:'HorseF.glb',
    desc:'走るのが {得意|とくい}な 大きな どうぶつです。{昔|むかし}は 人や {荷物|にもつ}を {運|はこ}ぶ いちばんの {乗|の}り{物|もの}でした。',
    mame:['赤ちゃんは 生まれて 数時間で 立って 歩きます。', '車に {仕事|しごと}を とられたのに、車の 力を {表|あらわ}す「馬力」に 名前だけ のこって います。'] },
  { name:'シマウマ', speed:'{時速|じそく} 64 km', size:'長さ {約|やく} 2.3 m', weight:'{約|やく} 300 kg', kind:'glb', src:'Zebra.glb',
    desc:'アフリカの 草原に すむ 馬の なかまです。しまの もようは、1 頭ずつ ちがいます。',
    mame:['しまもようは、{血|ち}を すう ハエを よせつけない {役|やく}に 立つと わかって きました。', '馬に そっくりなのに、人の {乗|の}り{物|もの}には なりませんでした。気が あらくて、かみついたら はなさないからだと 言われて います。'] },
  { name:'オオカミ', speed:'{時速|じそく} 65 km', size:'長さ {約|やく} 1.3 m', weight:'{約|やく} 40 kg', kind:'glb', src:'Wolf.glb',
    desc:'{群|む}れで くらし、なかまと 力を 合わせて {狩|か}りを する どうぶつです。いぬに 近い なかまです。',
    mame:['日本では、かみさまの {使|つか}いと されて きました。{埼玉|さいたま}の {三峯神社|みつみねじんじゃ}には、こま犬の かわりに オオカミの {像|ぞう}が あります。', '強そうですが、{狩|か}りは たいてい {失敗|しっぱい}します。5 回に 4 回ほどは、にげられて しまいます。'] },
  { name:'シカ', speed:'{時速|じそく} 80 km', size:'長さ {約|やく} 1.5 m', weight:'{約|やく} 80 kg', kind:'glb', src:'Stag.glb',
    desc:'森や 草原に すむ、草を 食べる どうぶつです。オスの 頭には、大きな 角が あります。',
    mame:['角は 毎年 春に ぽろりと {落|お}ちて、また 生えて きます。せっかく のばしたのに。', '{奈良|なら}の シカは、おじぎを します。せんべいが もらえると 知って いるからです。'] },
  { name:'じどうしゃ', speed:'{時速|じそく} 100 km', size:'長さ {約|やく} 4.5 m', weight:'{約|やく} 1.5 トン', kind:'glb', src:'sedan.glb',
    desc:'エンジンや モーターで 道を 走る {乗|の}り{物|もの}です。1886 年に、ドイツで ガソリンで 走る 車が 生まれました。',
    mame:['{時速|じそく} 100 km で 走れるのに、1 日の {約|やく} 95 パーセントは 止まって います。', 'じゅうたいに はまると、この ずかんの さいしょの カメと いい {勝負|しょうぶ}に なります。'] },
  { name:'ハト', speed:'{時速|じそく} 110 km', size:'長さ {約|やく} 33 cm', weight:'{約|やく} 350 g', kind:'glb', src:'pigeon.glb',
    desc:'町や 公園で よく 見かける 鳥です。遠くから 自分の 家に 帰る 力が あり、{昔|むかし}は 手紙を {運|はこ}ぶ {仕事|しごと}を して いました。',
    mame:['歩く 時に 首を ふるのは、けしきを ぶれずに 見る ためです。', '{平和|へいわ}の しょうちょうですが、{戦争|せんそう}では 手紙を {運|はこ}んで、くんしょうを もらった ハトが 32 羽も います。'] },
  { name:'でんしゃ', speed:'{時速|じそく} 115 km', size:'1 {両|りょう} {約|やく} 20 m', weight:'1 {両|りょう} {約|やく} 30 トン', kind:'glb', src:'localtrain.glb',
    desc:'レールの 上を 電気で 走る {乗|の}り{物|もの}です。日本では 1895 年に、{京都|きょうと}で はじめて 走りました。',
    mame:['日本の 電車は、少し おくれただけで おわびの {放送|ほうそう}が {流|なが}れます。', 'インドの ムンバイの 電車は、{定員|ていいん}の {約|やく} 2.6 {倍|ばい}の 人を {乗|の}せて 走ります。1 メートル四方に 14 人 {以上|いじょう}という {混|こ}み方には、「スーパー デンス クラッシュ ロード」という 名前まで あります。'] },
  { name:'チーター', speed:'{時速|じそく} 120 km', size:'長さ {約|やく} 1.2 m', weight:'{約|やく} 50 kg', kind:'glb', src:'cheetah.glb',
    desc:'アフリカの 草原などに すむ、地上で いちばん {速|はや}い どうぶつです。長い しっぽで バランスを とりながら 走ります。',
    mame:['{全力|ぜんりょく}で 走れるのは、300 メートルほどです。', 'ほえる ことが できません。鳴き声は、小鳥のような「チュン」です。'] },
  { name:'ジェットコースター', speed:'{時速|じそく} 150 km', size:'長さ {約|やく} 15 m', weight:'{約|やく} 10 トン', kind:'glb', src:'coaster.glb',
    desc:'レールの 上を 走る {遊園地|ゆうえんち}の {乗|の}り{物|もの}です。高い {所|ところ}から {落|お}ちる いきおいで 走ります。',
    mame:['もとは ロシアの {氷|こおり}の すべり台だと 言われ、ヨーロッパでは「ロシアの 山」と よぶ 国が あります。ところが ロシアでは「アメリカの 山」と よばれて います。', '2 時間 ならんで、3 分で おわります。それでも 人は また ならびます。'] },
  { name:'バイク', speed:'{時速|じそく} 160 km', size:'長さ {約|やく} 2.1 m', weight:'{約|やく} 200 kg', kind:'glb', src:'moto.glb',
    desc:'エンジンで 走る 2 りんの {乗|の}り{物|もの}です。体を かたむけて カーブを {曲|ま}がります。',
    mame:['1885 年に ドイツで 生まれた さいしょの バイクは、木で できて いて、たおれない ように 小さな 車りんが 左右に ついて いました。', 'アメリカの「ボスホス」という バイクは、車の エンジンを そのまま のせて います。{排気量|はいきりょう}は ふつうの 車の 4 倍ほどの 8,200 cc で、{重|おも}さは 600 kg を こえます。どうして 車に しなかったのかは、わかりません。'] },
  { name:'ヘリコプター', speed:'{時速|じそく} 250 km', size:'長さ {約|やく} 13 m', weight:'{約|やく} 3 トン', kind:'glb', src:'heli.glb',
    desc:'大きな プロペラを 回して うかぶ {乗|の}り{物|もの}です。まっすぐ 上に 上がったり、空中で 止まったり できます。',
    mame:['500 年 {以上|いじょう} 前に、レオナルド・ダ・ビンチが らせんの {形|かたち}の 空飛ぶ {機械|きかい}を 絵に かいて います。ただし、{重|おも}すぎて 飛ばなかっただろうと 考えられて います。', 'しっぽの 小さな プロペラが 止まると、体ごと ぐるぐる 回って しまいます。'] },
  { name:'プロペラき', speed:'{時速|じそく} 300 km', size:'長さ {約|やく} 10 m', weight:'{約|やく} 2 トン', kind:'glb', src:'prop.glb',
    desc:'プロペラを 回して 空気を おしながら {飛|と}ぶ {飛行機|ひこうき}です。1903 年に ライト兄弟が はじめて 空を {飛|と}んだ {飛行機|ひこうき}も、プロペラきでした。',
    mame:['1903 年 12 月、弟の オービルが {人類|じんるい}で はじめて、エンジンの ついた {飛行機|ひこうき}で 空を {飛|と}びました。時間は 12 {秒|びょう}、きょりは 36 メートル。今の ジャンボジェットの 長さの 半分ほどです。66 年後、この {飛行機|ひこうき}の 木と {布|ぬの}の 切れはしは、アポロ 11 {号|ごう}に のって 月まで 行きました。', 'ライト兄弟の お{仕事|しごと}は、{自転車屋|じてんしゃや}さんでした。'] },
  { name:'しんかんせん', speed:'{時速|じそく} 320 km', size:'1 {両|りょう} {約|やく} 25 m', weight:'1 {両|りょう} {約|やく} 45 トン', kind:'glb', src:'shinkansen.glb',
    desc:'日本の {高速鉄道|こうそくてつどう}です。1964 年に、東京と {大阪|おおさか}の 間で 走り{始|はじ}めました。',
    mame:['500 けいの 新幹線の 先頭は、カワセミの くちばしを まねて、トンネルを 出る 時の 大きな 音を おさえて います。', '{速|はや}く なった おかげで、{日帰|ひがえ}りの {出張|しゅっちょう}に 行かされる 人が ふえました。'] },
  { name:'F1', speed:'{時速|じそく} 370 km', size:'長さ {約|やく} 5.6 m', weight:'{約|やく} 800 kg', kind:'glb', src:'f1.glb',
    desc:'サーキットを 走る レース{用|よう}の 車です。{世界|せかい}の いくつもの 国で レースを して、1 年の {順位|じゅんい}を きそいます。',
    mame:['1 回の レースで、{運転手|うんてんしゅ}の {体重|たいじゅう}は あせで 2〜3 kg へります。', 'タイヤ 4 本の {交|こう}かんに かかる 時間は、{速|はや}い 時で 2 {秒|びょう}ほど。2023 年には 1.80 {秒|びょう}の {記録|きろく}が 出ました。'] },
  { name:'ハヤブサ', speed:'{時速|じそく} 390 km', size:'長さ {約|やく} 45 cm', weight:'{約|やく} 1 kg', kind:'glb', src:'falcon.glb',
    desc:'高い 空から {急降下|きゅうこうか}して、ほかの 鳥を つかまえる 鳥です。地球で いちばん {速|はや}い 生き物と されて います。',
    mame:['目が とても よく、{約|やく} 3 km 先の えものを 見つけられると 言われて います。{動|うご}きを 見分ける {速|はや}さも、人の 2 {倍|ばい} {以上|いじょう}です。', 'タカに そっくりで こわそうですが、本当は タカよりも インコに 近い なかまです。'] },
  { name:'リニアモーターカー', speed:'{時速|じそく} 600 km', size:'1 {両|りょう} {約|やく} 25 m', weight:'1 {両|りょう} {約|やく} 25 トン', kind:'glb', src:'maglev.glb',
    desc:'{磁石|じしゃく}の 力で うかんで 走る {列車|れっしゃ}です。車りんが レールに ふれないので、とても {速|はや}く 走れます。',
    mame:['{山梨|やまなし}の {実験線|じっけんせん}で、{時速|じそく} 603 km の {記録|きろく}を 出して います。', '1964 年の 新幹線の あとから ずっと {研究|けんきゅう}して いるのに、東京から {名古屋|なごや}への {開業|かいぎょう}は、早くても 2034 年です。'] },
  { name:'ひこうき', speed:'{時速|じそく} 900 km', size:'長さ {約|やく} 70 m', weight:'{約|やく} 400 トン', kind:'glb', src:'airliner.glb',
    desc:'つばさで うき、ジェットエンジンで {飛|と}ぶ 大きな {旅客機|りょかくき}です。{世界中|せかいじゅう}の 空を {時速|じそく} 900 km で {飛|と}んで います。',
    mame:['1 {機|き}あたり 1 年に 1 回くらいは かみなりに うたれて いますが、ふつうは そのまま {飛|と}びつづけます。', 'ジェットエンジンの {世界記録|せかいきろく}は、1 台で {約|やく} 60 トンの 力。ゾウ 10 頭を {持|も}ち上げられるほどです。'] },
  { name:'ブルーインパルス', speed:'{時速|じそく} 1,040 km', size:'長さ {約|やく} 13 m', weight:'{約|やく} 5 トン', kind:'glb', src:'blue_impulse.glb',
    desc:'{航空自衛隊|こうくうじえいたい}の アクロバット{飛行|ひこう}チームです。白い けむりで、空に 大きな 絵を かきます。',
    mame:['1964 年の 東京オリンピックの {開会式|かいかいしき}で、空に {五輪|ごりん}の マークを かきました。', '4 機が そろって さかさまに {飛|と}ぶ 技では、{操縦|そうじゅう}かんの {動|うご}きが ふだんと {逆|ぎゃく}に なります。それでも ぴたりと ならんだ まま {飛|と}びつづけます。パイロットは {無線|むせん}で 声を かけ合い、{隊形|たいけい}や けむりの タイミングを そろえて います。'] },
  { name:'おとの はやさ', speed:'{時速|じそく} 1,224 km', size:'かたちは ありません', weight:'ありません', kind:'glb', src:'starfighter.glb',
    desc:'音は、空気を ふるわせて {伝|つた}わります。空気の 中では、1 {秒|びょう}に {約|やく} 340 メートル {進|すす}みます。',
    mame:['水の 中では、空気の 中の {約|やく} 4 {倍|ばい}の {速|はや}さで {伝|つた}わります。', '音は 目に 見えないので、ゲームでは ジェット せんとうきの {姿|すがた}で 出てきます。モデルは、音の 2 {倍|ばい}の {速|はや}さで {飛|と}べる F-104 スターファイター。細い 形から「人が {乗|の}った ミサイル」と よばれました。'] },
  { name:'ちきゅうの じてん', speed:'{時速|じそく} 1,360 km', size:'{直径|ちょっけい} {約|やく} 1 万 2,700 km', weight:'{約|やく} 60 {垓|がい} トン', kind:'planet', map:'2k_earth_daymap.jpg',
    desc:'{地球|ちきゅう}は、1 日に 1 回、コマのように 回って います。日本の あたりでは、{時速|じそく} {約|やく} 1,360 km で {動|うご}いて います。',
    mame:['{赤道|せきどう}では {時速|じそく} {約|やく} 1,670 km。{北極|ほっきょく}の {真|ま}ん中では、その 場で くるくる 回って いるだけです。', '{恐竜|きょうりゅう}が いた 7,000 万年 前は、1 日が {約|やく} 23 時間半でした。', '{地球|ちきゅう}の 上の みんなも いっしょに {動|うご}いて いるので、だれも 気づきません。おばけを のぞいて。'] },
  { name:'X-1', speed:'{時速|じそく} 1,540 km', size:'長さ {約|やく} 9.4 m', weight:'{約|やく} 5.5 トン', kind:'glb', src:'x1.glb',
    desc:'アメリカの ロケット{実験機|じっけんき}です。1947 年に、{人類|じんるい}で はじめて {水平|すいへい}に {飛|と}んで 音の {速|はや}さを こえました。',
    mame:['自分では {離陸|りりく}せず、大きな {飛行機|ひこうき}の おなかに つるされて 空へ {運|はこ}ばれました。', 'パイロットは 2 日前に 馬から {落|お}ちて ろっこつを {折|お}って いましたが、ないしょで {飛|と}びました。ドアは、ほうきの ぼうを {使|つか}って しめました。'] },
  { name:'フェアリー デルタ 2', speed:'{時速|じそく} 1,822 km', size:'長さ {約|やく} 15.7 m', weight:'{約|やく} 6 トン', kind:'glb', src:'fd2.glb',
    desc:'イギリスの ジェット{実験機|じっけんき}です。1956 年に、{水平|すいへい}{飛行|ひこう}で はじめて 時速 1,000 マイル({約|やく} 1,609 km)を こえました。',
    mame:['それまでの {世界記録|せかいきろく}を、一気に {約|やく} 500 km も ぬりかえました。', '{着陸|ちゃくりく}の 時に 前が 見えるように、{機体|きたい}の 先が 下に {曲|ま}がります。この 機体の {研究|けんきゅう}は、のちの コンコルドの {開発|かいはつ}にも {役立|やくだ}ちました。'] },
  { name:'コンコルド', speed:'{時速|じそく} 2,180 km', size:'長さ {約|やく} 62 m', weight:'{約|やく} 185 トン', kind:'glb', src:'concorde.glb',
    desc:'イギリスと フランスが {共同|きょうどう}で 作った {超音速|ちょうおんそく} {旅客機|りょかくき}です。音の 2 {倍|ばい}の {速|はや}さで お客さんを {運|はこ}びました。',
    mame:['ロンドンを 朝に 出て ニューヨークに {着|つ}くと、時計は 出発した 時刻より 前に なって いました。「{着|つ}いてから 出発する」と {宣伝|せんでん}された {飛行機|ひこうき}です。', '作っている {途中|とちゅう}で もうからないと わかったのに、それまでの お金が もったいなくて、やめられませんでした。{損|そん}を ふやして しまう この 考え方は「コンコルド{効果|こうか}」と よばれて います。すばらしい {飛行機|ひこうき}なのに、{不名誉|ふめいよ}な 名前が {残|のこ}って しまいました。'] },
  { name:'Tu-144', speed:'{時速|じそく} 2,430 km', size:'長さ {約|やく} 66 m', weight:'{約|やく} 180 トン', kind:'glb', src:'tu144.glb',
    desc:'ソビエト{連邦|れんぽう}が 作った {超音速|ちょうおんそく} {旅客機|りょかくき}です。コンコルドより 2 か月 早い 1968 年の 12 月に {初飛行|はつひこう}しました。そっくりなので「コンコルドスキー」と あだ名が つきました。',
    mame:['{機内|きない}が うるさすぎて、となりの 人とは 紙に 書いて 話したと 言われて います。', 'コンコルドより {速|はや}かったのに、お客さんを {乗|の}せて {飛|と}んだのは 55 回だけでした。'] },
  { name:'せんとうき', speed:'{時速|じそく} 2,650 km', size:'長さ {約|やく} 19 m', weight:'{約|やく} 20 トン', kind:'glb', src:'f15.glb',
    desc:'空で たたかう ための ジェット機です。ゲームの モデルは、日本の {航空自衛隊|こうくうじえいたい}でも 使われて いる F-15 イーグルです。',
    mame:['1975 年に、高さ 3 万 メートルまで 3 分 28 {秒|びょう}で のぼる {記録|きろく}を 出しました。', 'エンジンの 力が 機体の {重|おも}さより 大きいので、まっすぐ 上に {向|む}かって {加速|かそく}する ことも できます。'] },
  { name:'ハレー彗星', speed:'{時速|じそく} 3,300 km', size:'{核|かく}の 長さ {約|やく} 15 km', weight:'{約|やく} 2,200 {億|おく}トン', kind:'maker', mk:'halley',
    desc:'{約|やく} 76 年ごとに {太陽|たいよう}の 近くへ もどって くる {彗星|すいせい}です。{氷|こおり}と ちりの かたまりで、{太陽|たいよう}に 近づくと 長い 尾を のばします。',
    mame:['{時速|じそく} 3,300 km は、{太陽|たいよう}から いちばん 遠い 時の {速|はや}さです。{太陽|たいよう}の 近くでは {時速|じそく} {約|やく} 19 万 km まで {速|はや}く なります。', '1910 年には、{地球|ちきゅう}が 尾の 中を 通ると 聞いて「{毒|どく}ガスで おわりだ」と 大さわぎに なり、ガスマスクや あやしい {薬|くすり}が 売れました。何も おきませんでした。'] },
  { name:'ヴァルキリー', speed:'{時速|じそく} 3,309 km', size:'長さ {約|やく} 56 m', weight:'{約|やく} 240 トン', kind:'glb', src:'xb70.glb',
    desc:'アメリカの 大きな {実験機|じっけんき} XB-70 です。音の 3 {倍|ばい}の {速|はや}さで {飛|と}びました。',
    mame:['つばさの 先を 下に {折|お}り{曲|ま}げて、自分が 作った 空気の {衝撃波|しょうげきは}に {乗|の}って {飛|と}びます。', '音の 3 {倍|ばい}で {飛|と}べる ように 作ったのに、{時代|じだい}が ミサイルに {変|か}わって いらなく なり、2 機しか 作られませんでした。'] },
  { name:'SR-71', speed:'{時速|じそく} 3,540 km', size:'長さ {約|やく} 33 m', weight:'{約|やく} 78 トン', kind:'glb', src:'sr71.glb',
    desc:'アメリカの ていさつ機で、ニックネームは ブラックバードです。ジェットエンジンで {飛|と}ぶ {飛行機|ひこうき}の 中で、今も いちばん {速|はや}い {記録|きろく}を もって います。',
    mame:['ミサイルを うたれても、{速|はや}さで ふりきって しまいました。', '{飛行中|ひこうちゅう}は {熱|ねつ}で 機体が のびるので、地上では すき間から {燃料|ねんりょう}が もれて いました。{飛|と}ぶと {熱|ねつ}で すき間が ふさがります。{燃料|ねんりょう}は 火が つきにくい {特別|とくべつ}な ものでした。'] },
  { name:'ミサイル', speed:'{時速|じそく} 4,000 km', size:'長さ {約|やく} 6 m', weight:'{約|やく} 1 トン', kind:'glb', src:'missile.glb',
    desc:'ロケットエンジンで {飛|と}び、{目標|もくひょう}へ {向|む}かって {進|すす}む {兵器|へいき}です。',
    mame:['英語の「ミサイル」は、ラテン語の「{投|な}げられる もの」が もとです。', '1 発で 何{億円|おくえん}も しますが、1 回しか {使|つか}えません。'] },
  { name:'スペースシャトル', speed:'{時速|じそく} 4,700 km', size:'長さ {約|やく} 56 m', weight:'{約|やく} 2,000 トン', kind:'glb', src:'shuttle.glb',
    desc:'アメリカの {宇宙船|うちゅうせん}です。1981 年から 2011 年まで、135 回 {宇宙|うちゅう}へ {飛|と}びました。くり返し {使|つか}える ように 作られました。',
    mame:['帰りは エンジンを {使|つか}わず、グライダーのように すべって {着陸|ちゃくりく}します。やり直しは できません。', '打ち上げを {安|やす}くする ために くり返し {使|つか}う はずでしたが、{平均|へいきん}で 1 回 {約|やく} 15 {億|おく}ドルも かかりました。'] },
  { name:'X-15', speed:'{時速|じそく} 7,270 km', size:'長さ {約|やく} 15 m', weight:'{約|やく} 15 トン', kind:'glb', src:'x15.glb',
    desc:'アメリカの ロケット{実験機|じっけんき}です。1967 年に {時速|じそく} 7,274 km を 出し、今も 人が {乗|の}る {飛行機|ひこうき}の {世界記録|せかいきろく}です。',
    mame:['月に 行った アームストロング{船長|せんちょう}も、X-15 の パイロットでした。', '大きな {飛行機|ひこうき}の つばさの 下から 切りはなされ、ロケットを {約|やく} 80 {秒|びょう} もやして、{宇宙|うちゅう}の 入り口まで のぼりました。'] },
  { name:'ロケット', speed:'{時速|じそく} 12,000 km', size:'高さ {約|やく} 60 m', weight:'{約|やく} 570 トン', kind:'glb', src:'rocket.glb',
    desc:'{燃料|ねんりょう}を もやした ガスを 後ろに ふき出して、その いきおいで {進|すす}みます。空気の ない {宇宙|うちゅう}でも {進|すす}めます。',
    mame:['日本の ロケットの {開発|かいはつ}は、1955 年の 長さ 23 cm の「ペンシルロケット」から {始|はじ}まりました。', '{重|おも}さの {約|やく} 9 わりは {燃料|ねんりょう}です。ほとんど、{燃料|ねんりょう}を {運|はこ}ぶ ために {飛|と}んで います。'] },
  { name:'エリス', speed:'{時速|じそく} 12,300 km', size:'{直径|ちょっけい} {約|やく} 2,300 km', weight:'{地球|ちきゅう}の {約|やく} 0.3 パーセント', kind:'planet', map:'2k_eris_fictional.jpg',
    desc:'{太陽系|たいようけい}の 外の 方を 回る {準惑星|じゅんわくせい}です。2005 年に {発見|はっけん}が {発表|はっぴょう}されました。この 絵は {想像|そうぞう}です。',
    mame:['{太陽|たいよう}を 1 周するのに {約|やく} 560 年 かかります。', '名前は ギリシャ{神話|しんわ}の あらそいの {女神|めがみ}。見つかった せいで {天文学者|てんもんがくしゃ}たちの {議論|ぎろん}が おこり、{冥王星|めいおうせい}が {惑星|わくせい}から 外されました。'] },
  { name:'冥王星', speed:'{時速|じそく} 17,100 km', size:'{直径|ちょっけい} {約|やく} 2,400 km', weight:'{地球|ちきゅう}の {約|やく} 0.2 パーセント', kind:'planet', map:'2k_pluto.jpg',
    desc:'{太陽系|たいようけい}の 外の 方を 回る {準惑星|じゅんわくせい}です。1930 年に 見つかり、2006 年までは 9 番目の {惑星|わくせい}でした。',
    mame:['{表面|ひょうめん}には、ハートの 形の 白い もようが あります。', '{太陽|たいよう}を 1 周するのに 248 年 かかります。見つかってから まだ 1 周も して いないのに、{惑星|わくせい}を クビに なりました。'] },
  { name:'海王星', speed:'{時速|じそく} 19,600 km', size:'{直径|ちょっけい} {約|やく} 5 万 km', weight:'{地球|ちきゅう}の {約|やく} 17 {倍|ばい}', kind:'planet', map:'2k_neptune.jpg',
    desc:'{太陽|たいよう}から いちばん 遠い {惑星|わくせい}です。{大気|たいき}に ふくまれる メタンの はたらきで、青く 見えます。',
    mame:['{計算|けいさん}で {場所|ばしょ}を {予言|よげん}してから、{望遠鏡|ぼうえんきょう}で 見つけられた {惑星|わくせい}です。', '{太陽系|たいようけい}で いちばん 強い 風が ふきます。{時速|じそく} {約|やく} 2,100 km。{地球|ちきゅう}の 音の {速|はや}さより {速|はや}い 風です。'] },
  { name:'天王星', speed:'{時速|じそく} 24,500 km', size:'{直径|ちょっけい} {約|やく} 5 万 1,000 km', weight:'{地球|ちきゅう}の {約|やく} 14.5 {倍|ばい}', kind:'planet', map:'2k_uranus.jpg', tilt:1.7,
    desc:'{太陽|たいよう}から 7 番目の {惑星|わくせい}です。うすい 青緑色で、細い {環|わ}が あります。',
    mame:['{自転|じてん}の {軸|じく}が ほぼ 横だおしで、ごろごろ ころがる ように 回って います。', '雲には、くさった たまごの においの ガスが ふくまれて います。', '見つけた 人は、王さまに 気に入られようと「ジョージの 星」と 名づけました。イギリスの 外では、ほとんど 使われませんでした。'] },
  { name:'土星', speed:'{時速|じそく} 34,800 km', size:'{直径|ちょっけい} {約|やく} 12 万 km<br>{環|わ}まで {約|やく} 27 万 km', weight:'{地球|ちきゅう}の {約|やく} 95 ばい', kind:'planet', map:'2k_saturn.jpg', ring:'2k_saturn_ring_alpha.png',
    desc:'{太陽系|たいようけい}で 2 番目に 大きな {惑星|わくせい}で、{太陽|たいよう}から 6 番目を 回って います。大きな {環|わ}が 目じるしです。',
    mame:['{環|わ}は {氷|こおり}の つぶの あつまり。はしから はしまで {地球|ちきゅう} 20 こぶん {以上|いじょう} あるのに、{厚|あつ}さは 多くの {場所|ばしょ}で 10 メートルくらいです。', '{環|わ}は 少しずつ 土星に ふりそそいでいて、{数億年|すうおくねん}の うちに なくなるかも しれません。', '水より {軽|かる}いので、大きな プールが あれば うきます。そんな プールは ありませんが。'] },
  { name:'木星', speed:'{時速|じそく} 47,000 km', size:'{直径|ちょっけい} {約|やく} 14 万 km', weight:'{地球|ちきゅう}の {約|やく} 318 {倍|ばい}', kind:'planet', map:'2k_jupiter.jpg',
    desc:'{太陽系|たいようけい}で いちばん 大きな {惑星|わくせい}です。{表面|ひょうめん}の しまもようは、ガスの 雲の 流れです。',
    mame:['{大赤斑|だいせきはん}と いう うずは、{地球|ちきゅう}より 大きな あらしです。何百年も ふきつづけて います。', '{衛星|えいせい}エウロパの {氷|こおり}の 下には、{地球|ちきゅう}の 海の 2 {倍|ばい}ほどの 水が あると 考えられて います。生き物が すめるかどうかを {調|しら}べに、2030 年に NASA の {探査機|たんさき}が {着|つ}く {予定|よてい}です。'] },
  { name:'ボイジャー1号', speed:'{時速|じそく} 61,200 km', size:'はば {約|やく} 13 m', weight:'{約|やく} 800 kg', kind:'glb', src:'voyager.glb',
    desc:'NASA が 1977 年に 打ち上げた {探査機|たんさき}です。木星と 土星を {調|しら}べた あと、今も {太陽系|たいようけい}の 外へ {飛|と}びつづけて います。人が 作った {物|もの}の 中で、{地球|ちきゅう}から いちばん 遠くに あります。',
    mame:['2026 年 11 月 18 日に、{地球|ちきゅう}から 光の {速|はや}さで ちょうど 1 日 かかる {所|ところ}まで 行きました。', '{宇宙人|うちゅうじん}に 聞いて もらう ために、{地球|ちきゅう}の 音や 音楽を 入れた 金の レコードを のせて います。{再生|さいせい}の しかたの 絵と、{針|はり}も ついて います。'] },
  { name:'ケレス', speed:'{時速|じそく} 64,400 km', size:'{直径|ちょっけい} {約|やく} 940 km', weight:'{地球|ちきゅう}の {約|やく} 0.016 パーセント', kind:'planet', map:'2k_ceres.jpg',
    desc:'火星と 木星の 間の {小惑星帯|しょうわくせいたい}に ある {準惑星|じゅんわくせい}です。{小惑星帯|しょうわくせいたい}で いちばん 大きな {天体|てんたい}です。',
    mame:['クレーターの 中の 明るい 点は、{塩|しお}の かたまりだと わかりました。', '1801 年に 見つかった 時は {惑星|わくせい}と よばれ、50 年ほどで {小惑星|しょうわくせい}に なり、2006 年に {準惑星|じゅんわくせい}に なりました。{肩書|かたが}きが なかなか {決|き}まりません。'] },
  { name:'火星', speed:'{時速|じそく} 86,700 km', size:'{直径|ちょっけい} {約|やく} 6,800 km', weight:'{地球|ちきゅう}の {約|やく} 11 パーセント', kind:'planet', map:'2k_mars.jpg',
    desc:'{太陽|たいよう}から 4 番目の {惑星|わくせい}です。赤く 見えるのは、土に ふくまれる 鉄が さびて いるからです。',
    mame:['オリンポス山は、高さ {約|やく} 2 万 2,000 メートル。エベレストの {約|やく} 2.5 {倍|ばい}も あります。', '1999 年、NASA の {探査機|たんさき}が、メートルと ポンドの {単位|たんい}の まちがいで、火星に 近づきすぎて なくなりました。'] },
  { name:'地球', speed:'{時速|じそく} 107,200 km', size:'{直径|ちょっけい} {約|やく} 1 万 2,700 km', weight:'{約|やく} 60 {垓|がい} トン', kind:'planet', map:'2k_earth_daymap.jpg',
    desc:'{太陽|たいよう}の まわりを 1 年かけて 回って います。{私|わたし}たちも 今、{時速|じそく} 107,200 km で いっしょに {動|うご}いて います。',
    mame:['1 {秒|びょう}に {約|やく} 30 km {進|すす}みます。東京から {横浜|よこはま}までが、1 {秒|びょう}です。', '{紀元前|きげんぜん} 3 {世紀|せいき}に「{地球|ちきゅう}が {動|うご}いて いる」と 言った 人が いました。みんなが {信|しん}じるまでに、1,800 年 {以上|いじょう} かかりました。'] },
  { name:'金星', speed:'{時速|じそく} 126,000 km', size:'{直径|ちょっけい} {約|やく} 1 万 2,100 km', weight:'{地球|ちきゅう}の {約|やく} 82 パーセント', kind:'planet', map:'2k_venus_atmosphere.jpg',
    desc:'{太陽|たいよう}から 2 番目の {惑星|わくせい}です。{地球|ちきゅう}と ほぼ 同じ 大きさですが、{表面|ひょうめん}は {約|やく} 460 度の 世界です。',
    mame:['1 回 {自転|じてん}するのに 243 日、{太陽|たいよう}を 1 周するのに 225 日 かかります。1 日が 1 年より 長い {惑星|わくせい}です。', '{美|び}の {女神|めがみ}の 名前が ついて いますが、雲は {硫酸|りゅうさん}で、空気の {重|おも}さは {地球|ちきゅう}の {約|やく} 90 {倍|ばい}です。{着陸|ちゃくりく}した {探査機|たんさき}は、2 時間ほどしか もちませんでした。'] },
  { name:'水星', speed:'{時速|じそく} 170,500 km', size:'{直径|ちょっけい} {約|やく} 4,900 km', weight:'{地球|ちきゅう}の {約|やく} 5.5 パーセント', kind:'planet', map:'2k_mercury.jpg',
    desc:'{太陽|たいよう}に いちばん 近く、いちばん 小さな {惑星|わくせい}です。{太陽|たいよう}の まわりを 88 日で 回ります。',
    mame:['{太陽|たいよう}に いちばん 近いのに、いちばん {熱|あつ}い {惑星|わくせい}は 金星です。水星は 2 番目です。', '日本の {探査機|たんさき}「みお」は、2018 年に 出発しました。{地球|ちきゅう}や 金星の そばを 何度も 通って、水星に {着|つ}くのは 8 年後です。'] },
  { name:'ロボット', speed:'{時速|じそく} 200,000 km', size:'ひみつ', weight:'ひみつ', kind:'glb', src:'mech3.glb',
    desc:'日本の アニメには、{銀河系|ぎんがけい}より 大きい ロボットや、光の {速|はや}さに 近い {速|はや}さで {飛|と}ぶ ロボットが 出てきます。そんな ものは、この ゲームには 出られません。',
    mame:['「ロボット」と いう 言葉は、チェコ語の「むりやり はたらかされる こと」が もとです。', 'おばけに ぬかれる 前に、かならず 決めポーズを します。{勝負|しょうぶ}より ポーズです。'] },
  { name:'オウムアムア', speed:'{時速|じそく} 315,000 km', size:'長さ {約|やく} 400 m', weight:'わかって いません', kind:'maker', mk:'oumuamua',
    desc:'2017 年に 見つかった、{太陽系|たいようけい}の 外から 来た はじめての {天体|てんたい}です。名前は ハワイの 言葉で「遠くから はじめて 来た {使者|ししゃ}」という 意味です。',
    mame:['{葉巻|はまき}のような 形と 言われましたが、{円盤|えんばん}のような 形かも しれません。もう 遠くへ 行って しまって、{確|たし}かめられません。', 'ふしぎな {動|うご}きを したので、「{宇宙人|うちゅうじん}の {宇宙船|うちゅうせん}かも」と 言い出す {学者|がくしゃ}まで 出ました。'] },
  { name:'パーカー・ソーラー・プローブ', speed:'{時速|じそく} 692,000 km', size:'長さ {約|やく} 3 m', weight:'{約|やく} 690 kg', kind:'maker', mk:'parker',
    desc:'NASA の {太陽|たいよう}{探査機|たんさき}です。2024 年 12 月に {太陽|たいよう}に 近づき、人が 作った {物|もの}の 中で いちばん {速|はや}く なりました。',
    mame:['東京から ニューヨークまで、1 分も かからない {速|はや}さです。', '{熱|ねつ}よけの {盾|たて}の 外は 1,000 度を こえるのに、{内側|うちがわ}は {約|やく} 30 度に たもつ 作りです。'] },
  { name:'宇宙戦艦', speed:'{時速|じそく} 780,000 km', size:'ひみつ', weight:'ひみつ', kind:'glb', src:'battleship3.glb',
    desc:'アニメの {戦艦|せんかん}は ロマンの かたまりです。ワープも できるし、ビームも うてるのです。でも、{戦争|せんそう}は いやだな。',
    mame:['たたかう ための 船なのに、おばけに ぬかれると {祝砲|しゅくほう}で お祝いして くれます。', '{時速|じそく} 78 万 km で {進|すす}みますが、どこへ {向|む}かって いるのかは、だれも 知りません。'] },
  { name:'アンドロメダ銀河', speed:'{時速|じそく} 1,080,000 km', size:'{直径|ちょっけい} {約|やく} 22 万 {光年|こうねん}', weight:'{太陽|たいよう}の {約|やく} 1 {兆|ちょう} {倍|ばい}', kind:'maker', mk:'andromeda',
    desc:'{天の川銀河|あまのがわぎんが}の おとなりの 大きな {銀河|ぎんが}です。{地球|ちきゅう}から {約|やく} 250 万{光年|こうねん} はなれて います。',
    mame:['{数十億年|すうじゅうおくねん}後に {天の川銀河|あまのがわぎんが}と ぶつかるかも しれません。ぶつかる {確率|かくりつ}は、{研究|けんきゅう}に よって 5 わりから 9 わりです。', '本物は 大きすぎるので、ゲームでは 1 辺 12 m の {立方体|りっぽうたい}に 写真を はって {飛|と}ばして います。'] },
  { name:'おばけ', guest:true, speed:'{時速|じそく} 830,000 km', size:'見る人に よる', weight:'0 kg (たぶん)', kind:'art', src:'obake-egao.png',
    desc:'{天国|てんごく}の 雲の 上に すんでいる、この ゲームの {主人公|しゅじんこう}です。{重力|じゅうりょく}を {感|かん}じないので、ぼんやり していると {地球|ちきゅう}に おいていかれます。',
    mame:['赤ちゃんが おばけの {夢|ゆめ}を 見て いるのか、おばけが 赤ちゃんの {夢|ゆめ}を 見て いるのか。{結末|けつまつ}を 気に したら ねられなく なりそうですが、おそらく あなたの 考える いちばん ハッピーな 形が {正解|せいかい}です。'] },
  { name:'かみさま', guest:true, speed:'ひみつ', size:'ひみつ', weight:'きかないでね', kind:'art', src:'kamisama-egao.png',
    desc:'{天国|てんごく}の 雲の 上に いて、星の つえで おばけを {見守|みまも}って います。',
    mame:['{物理|ぶつり}に {非常|ひじょう}に くわしいです。この ずかんの ほとんどを 書いて います。おばけが 大好きです。'] }
];

const ruby = s => s.replace(/\{([^|}]+)\|([^}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>');
const EN_ON = lang === 'en';
const EN = EN_ON ? (await import('./zukan-en.js')).default : null;
const tr = e => (EN && EN[e.name]) || {};
const speedOf = e => { if (tr(e).speed) return tr(e).speed; const m = e.speed.match(/([\d,]+) km/); if (!m) return e.speed; const v = fmtSpeed(+m[1].replace(/,/g, '')) + ' ' + unitLabel(); return EN_ON ? v : '{時速|じそく} ' + v; };
const ANIM = new Set(['Donkey.glb', 'ShibaInu.glb', 'Fox.glb', 'HorseF.glb', 'Zebra.glb', 'Wolf.glb', 'Stag.glb']);
const assetUrl = n => n.startsWith('2k_') ? 'planets/' + n : /\.png$/.test(n) ? 'assets/chara/' + n : ANIM.has(n) ? 'assets/anim/' + n : n === 'sedan.glb' ? 'assets/car/' + n : 'assets/craft/' + n;
const L = EN_ON
  ? { title:'Field Guide', speed:'Speed', size:'Size', weight:'Weight', desc:'About', mame:'Fun Facts', load:'Loading…', fail:'Could not load the model', back:'Back' }
  : { title:'ずかん', speed:'{速|はや}さ', size:'大きさ', weight:'{重|おも}さ', desc:'せつめい', mame:'マメちしき', load:'よみこみ中…', fail:'もけいを よみこめませんでした', back:'もどる' };

const CSS = `
.zk{position:fixed;inset:0;z-index:60;overflow:hidden;background:#0c0a25;color:#3b3350;font-family:"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif}
.zk-head{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;align-items:center;justify-content:center;box-sizing:border-box;height:calc(50px + env(safe-area-inset-top));padding-top:env(safe-area-inset-top);background:rgba(255,255,255,.78);font-weight:900;font-size:20px}
.zk-close,.zk-back{position:absolute;left:10px;border:0;border-radius:10px;padding:6px 12px;font:inherit;font-size:15px;font-weight:bold;background:#fff;color:#3b3350;cursor:pointer;box-shadow:0 1px 4px rgba(40,40,90,.2)}
.zk-close{bottom:7px}
.zk-back{top:calc(8px + env(safe-area-inset-top));z-index:2}
.zk-lad{position:absolute;inset:0;overflow-y:auto;-webkit-overflow-scrolling:touch}
.zk-track{position:relative;box-sizing:border-box;padding:calc(66px + env(safe-area-inset-top)) 12px calc(30px + env(safe-area-inset-bottom)) 74px;background:linear-gradient(to top,#a8d878 0,#bfe3f8 9%,#6fb0ea 34%,#2a3f8f 52%,#141a55 68%,#0c0a25 100%)}
.zk-track::before{content:"";position:absolute;left:39px;top:calc(66px + env(safe-area-inset-top));bottom:30px;width:4px;border-radius:2px;background:rgba(255,255,255,.8)}
.zk-rung{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;box-sizing:border-box;width:100%;min-height:54px;margin:8px 0;padding:6px 14px;border:0;border-radius:14px;background:rgba(255,255,255,.93);color:#3b3350;font:inherit;text-align:left;cursor:pointer;box-shadow:0 2px 6px rgba(20,20,60,.28)}
.zk-rung::before{content:"";position:absolute;left:-41px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(60,60,120,.3)}
.zk-rung.on{background:#ffe9a8}
.zk-rung b{font-size:17px;font-weight:900;line-height:1.3}
.zk-rung span{flex:none;font-size:13px;font-weight:bold;color:#7a6a3a}
.zk-rung rt{font-size:.55em}
.zk-ghost{position:absolute;left:14px;top:0;z-index:2;width:54px;height:72px;pointer-events:none;transition:transform .42s cubic-bezier(.3,.9,.4,1)}
.zk-ghost img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(20,20,60,.45))}
.zk-sheet{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;background:linear-gradient(#bfe3f8,#fff6e6);transform:translateY(100%);visibility:hidden;transition:transform .32s ease,visibility 0s .32s}
.zk-open .zk-sheet{transform:none;visibility:visible;transition:transform .32s ease}
.zk-view{position:relative;flex:1 1 38%;min-height:180px}
.zk-view canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.zk-msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:bold}
.zk-info{flex:1 1 46%;min-height:0;display:flex;flex-direction:column}
.zk-name{text-align:center;font-weight:900;font-size:26px;line-height:1.3}
.zk-spec{display:flex;gap:6px;width:100%;max-width:620px;box-sizing:border-box;margin:2px auto 0;padding:0 14px}
.zk-spec div{flex:1 1 0;min-width:0;background:rgba(255,255,255,.8);border-radius:10px;padding:3px 4px 5px;text-align:center;font-size:clamp(13px,3.6vw,16px);font-weight:900;line-height:1.35}
.zk-spec span{display:block;font-size:12px;font-weight:bold;color:#7a6a3a;line-height:1.7}
.zk-spec rt{font-size:.55em}
.zk-cards{flex:1;min-height:0;overflow:auto;padding:0 14px calc(10px + env(safe-area-inset-bottom))}
.zk-card{background:#fff;border-radius:14px;padding:8px 14px 10px;margin:8px auto;max-width:620px;font-size:16px;line-height:2;box-shadow:0 2px 6px rgba(70,60,110,.15)}
.zk-card b{display:table;font-size:13px;line-height:1.7;border-radius:999px;padding:0 12px;color:#fff}
.zk-d b{background:#4a90d9}.zk-m b{background:#3fae7a}
.zk-card p{margin:4px 0 0}
.zk-card rt{font-size:.55em}
html:not([lang="ja"]) .zk-card{line-height:1.55}
@media (min-aspect-ratio:1/1){
  .zk-sheet{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr)}
  .zk-view{grid-column:1;grid-row:1}
  .zk-info{grid-column:2;grid-row:1;padding-top:calc(10px + env(safe-area-inset-top))}
}
`;


export function openZukan(parent, opts = {}) {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);
  const root = document.createElement('div');
  root.className = 'zk';

  let rungs = '';
  for (let i = ENTRIES.length - 1; i >= 0; i--) {
    const e = ENTRIES[i];
    rungs += `<button type="button" class="zk-rung" data-i="${i}"><b>${tr(e).name ?? e.name}</b><span>${e.guest ? '' : ruby(speedOf(e))}</span></button>`;
  }

  root.innerHTML =
    '<div class="zk-head">' + (opts.onClose ? '<button type="button" class="zk-close">' + L.back + '</button>' : '') + L.title + '</div>'
    + '<div class="zk-lad"><div class="zk-track"><div class="zk-ghost"><img alt="" src="assets/chara/obake-egao.png"></div>' + rungs + '</div></div>'
    + '<div class="zk-sheet"><button type="button" class="zk-back">' + L.back + '</button><div class="zk-view"><canvas></canvas><div class="zk-msg" hidden></div></div>'
    + '<div class="zk-info"><div class="zk-name"></div><div class="zk-spec"></div><div class="zk-cards"></div></div></div>';

  const lad = root.querySelector('.zk-lad'), track = root.querySelector('.zk-track'), ghost = root.querySelector('.zk-ghost');
  const view = root.querySelector('.zk-view'), msg = root.querySelector('.zk-msg');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas:root.querySelector('canvas'), antialias:true, alpha:true }); }
  catch (err) { st.remove(); throw err; }
  parent.appendChild(root);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.35, 7.2);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(3, 4, 5);
  scene.add(sun);
  const spin = new THREE.Group();
  scene.add(spin);

  const fit = () => {
    const w = view.clientWidth, h = view.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = 7.2 * Math.max(1, 1.1 / camera.aspect);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(view);

  const keep = new Set(opts.shared || []);
  const free = c => c.traverse(o => {
    if (o.geometry && !o.isSprite) o.geometry.dispose();
    if (o.material) [].concat(o.material).forEach(m => { if (m.map && !keep.has(m.map)) m.map.dispose(); m.dispose(); });
  });
  const clearModel = () => {
    while (spin.children.length) {
      const c = spin.children[0];
      spin.remove(c);
      free(c);
    }
  };

  const manager = new THREE.LoadingManager();
  manager.setURLModifier(u => u.replace(/assets\/(city|car|fest)\/Textures\/colormap\.png$/, 'assets/$1/colormap-$1.png'));
  const tex = new THREE.TextureLoader(), gltf = new GLTFLoader(manager);
  const loadTex = url => new Promise((ok, ng) => tex.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; ok(t); }, undefined, ng));

  async function build(e) {
    if (e.kind === 'glb') {
      const m = (await gltf.loadAsync(assetUrl(e.src))).scene, box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      const k = 2.6 / Math.max(size.x, size.y, size.z);
      m.position.sub(c).multiplyScalar(k);
      m.scale.multiplyScalar(k);
      const g = new THREE.Group();
      g.add(m);
      return g;
    }
    if (e.kind === 'planet') {
      const g = new THREE.Group(), map = await loadTex(assetUrl(e.map)), ball = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ map, roughness:1 }));
      g.add(ball);
      if (e.ring) {
        const R0 = 1.24, R1 = 2.27, geo = new THREE.RingGeometry(R0, R1, 128, 1), p = geo.attributes.position, uv = geo.attributes.uv;
        for (let i = 0; i < p.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - R0) / (R1 - R0), 0.5);
        const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map:await loadTex(assetUrl(e.ring)), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
        ring.rotation.x = -Math.PI / 2;
        g.add(ring);
      }
      g.scale.setScalar(0.72);
      g.rotation.z = e.tilt ?? 0.42;
      return g;
    }
    if (e.kind === 'maker') {
      const m = opts.makers[e.mk](), box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      const k = 2.6 / Math.max(size.x, size.y, size.z), g = new THREE.Group();
      m.position.sub(c);
      g.add(m);
      g.scale.setScalar(k);
      g.userData.tick = m.userData.tick;
      return g;
    }
    const map = await loadTex(assetUrl(e.src)), a = map.image.width / map.image.height;
    return new THREE.Mesh(new THREE.PlaneGeometry(3.4 * a, 3.4), new THREE.MeshBasicMaterial({ map, transparent:true, side:THREE.DoubleSide }));
  }

  let token = 0, kind = 'glb', showing = false, cur = 0, wait = 0, tickFn = null;

  async function select(i) {
    const e = ENTRIES[i], my = ++token;
    root.querySelector('.zk-name').textContent = tr(e).name ?? e.name;
    root.querySelector('.zk-spec').innerHTML = [[L.speed, speedOf(e)], [L.size, tr(e).size ?? e.size], [L.weight, tr(e).weight ?? e.weight]].map(([k, v]) => `<div><span>${ruby(k)}</span>${ruby(v)}</div>`).join('');
    root.querySelector('.zk-cards').innerHTML =
      `<div class="zk-card zk-d"><b>${L.desc}</b>${ruby(tr(e).desc ?? e.desc)}</div><div class="zk-card zk-m"><b>${L.mame}</b>${(tr(e).mame ?? e.mame).map(m => '<p>' + ruby(m) + '</p>').join('')}</div>`;
    root.querySelector('.zk-cards').scrollTop = 0;
    clearModel();
    tickFn = null;
    msg.hidden = false;
    msg.textContent = L.load;
    try {
      const obj = await build(e);
      if (my !== token) { free(obj); return; }
      spin.rotation.y = 0;
      spin.add(obj);
      kind = e.kind;
      tickFn = obj.userData.tick || null;
      msg.hidden = true;
    } catch (err) {
      if (my === token) msg.textContent = L.fail;
    }
  }

  const place = i => {
    const b = track.querySelector(`.zk-rung[data-i="${i}"]`);
    ghost.style.transform = `translateY(${b.offsetTop + (b.offsetHeight - 72) / 2}px)`;
    track.querySelectorAll('.zk-rung').forEach(r => r.classList.toggle('on', r === b));
  };

  const start = () => { place(cur); if (!showing) lad.scrollTop = lad.scrollHeight; };
  start();
  document.fonts.ready.then(start);

  track.addEventListener('click', ev => {
    const b = ev.target.closest('.zk-rung');
    if (!b) return;
    cur = +b.dataset.i;
    place(cur);
    clearTimeout(wait);
    wait = setTimeout(() => {
      select(cur);
      showing = true;
      root.classList.add('zk-open');
      fit();
    }, 430);
  });

  root.querySelector('.zk-back').addEventListener('click', () => {
    token++;
    showing = false;
    root.classList.remove('zk-open');
    clearModel();
  });

  let last = performance.now(), t = 0;
  renderer.setAnimationLoop(now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!showing) return;
    t += dt;
    if (tickFn) tickFn(dt, 1);
    if (kind === 'art') spin.rotation.y = Math.sin(t * 0.9) * 0.35;
    else spin.rotation.y += dt * 0.55;
    renderer.render(scene, camera);
  });

  if (opts.onClose) root.querySelector('.zk-close').addEventListener('click', () => {
    clearTimeout(wait);
    token++;
    renderer.setAnimationLoop(null);
    ro.disconnect();
    clearModel();
    renderer.forceContextLoss();
    renderer.dispose();
    root.remove();
    st.remove();
    opts.onClose();
  });
}
