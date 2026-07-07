import { useState, useCallback, useRef } from 'react'
import { useStore } from '../store'
import { chat } from '../lib/ai'

interface WordEntry {
  char: string
  pinyin: string
  modern: string
  classical: string
  example: string
  source: string
  strokeCount?: number
}

var DICTIONARY: Record<string, WordEntry> = {
  '之': { char: '之', pinyin: 'zhī', modern: '的', classical: '①代词，这/他/她/它；②动词，往、到……去；③助词，的；④音节助词，无义', example: '吾欲之南海', source: '《为学》彭端淑' },
  '乎': { char: '乎', pinyin: 'hū', modern: '语气词', classical: '①表疑问，吗；②表感叹，啊；③介词，相当于"于"', example: '不亦乐乎', source: '《论语》' },
  '者': { char: '者', pinyin: 'zhě', modern: '……的人/事物', classical: '①代词，……的人/事物；②助词，表提顿', example: '陈胜者，阳城人也', source: '《陈涉世家》司马迁' },
  '也': { char: '也', pinyin: 'yě', modern: '也', classical: '①句末语气词，表判断/肯定/感叹/疑问；②句中表停顿', example: '夫战，勇气也', source: '《曹刿论战》' },
  '矣': { char: '矣', pinyin: 'yǐ', modern: '了', classical: '句末语气词，表已然、将然或感叹', example: '壮士不已', source: '《史记》' },
  '焉': { char: '焉', pinyin: 'yān', modern: '哪里/怎么', classical: '①代词，之/于此；②语气词；③疑问代词，哪里', example: '三人行，必有我师焉', source: '《论语》' },
  '哉': { char: '哉', pinyin: 'zāi', modern: '啊', classical: '句末语气词，表感叹或反问', example: '善哉！技盖至此乎', source: '《庄子·养生主》' },
  '兮': { char: '兮', pinyin: 'xī', modern: '啊', classical: '句中语气词，多见于楚辞，表舒缓语气', example: '路漫漫其修远兮', source: '《离骚》屈原' },
  '其': { char: '其', pinyin: 'qí', modern: '他的/它的', classical: '①代词，他的/那；②副词，大概/难道；③连词，如果', example: '其真无马邪', source: '《马说》韩愈' },
  '而': { char: '而', pinyin: 'ér', modern: '并且/但是', classical: '①连词，表并列/递进/转折/承接/修饰/假设', example: '学而不思则罔', source: '《论语》' },
  '则': { char: '则', pinyin: 'zé', modern: '就/那么', classical: '①连词，就/却/那么；②副词，是/就是；③名词，准则', example: '学而不思则罔', source: '《论语》' },
  '乃': { char: '乃', pinyin: 'nǎi', modern: '于是/就', classical: '①副词，于是/就/才/竟然/却；②判断词，是', example: '乃不知有汉', source: '《桃花源记》陶渊明' },
  '且': { char: '且', pinyin: 'qiě', modern: '而且/并且', classical: '①连词，而且/并且/况且/尚且；②副词，将近/将要', example: '且欲与常马等不可得', source: '《马说》韩愈' },
  '如': { char: '如', pinyin: 'rú', modern: '像/如同', classical: '①动词，像/如同比得上；②连词，如果/至于', example: '如闻仙乐耳暂明', source: '《琵琶行》白居易' },
  '若': { char: '若', pinyin: 'ruò', modern: '像/如果', classical: '①动词，像/如同比得上；②连词，如果；③代词，你', example: '海内存知己，天涯若比邻', source: '《送杜少府之任蜀州》王勃' },
  '于': { char: '于', pinyin: 'yú', modern: '在/从/对于', classical: '介词，在/从/到/对于/比/被', example: '战于长勺', source: '《曹刿论战》' },
  '以': { char: '以', pinyin: 'yǐ', modern: '用/拿/因为', classical: '①介词，用/拿/凭/因为/在；②连词，来/以便/以至于', example: '以刀劈狼首', source: '《狼》蒲松龄' },
  '为': { char: '为', pinyin: 'wéi/wèi', modern: '做/是/为了', classical: '①动词，做/担任/是/成为；②介词，给/替/因为/被', example: '为人谋而不忠乎', source: '《论语》' },
  '因': { char: '因', pinyin: 'yīn', modern: '因为', classical: '①介词，凭借/通过/趁着/因为；②连词，于是/就', example: '因势利导', source: '《史记》' },
  '故': { char: '故', pinyin: 'gù', modern: '所以/原因', classical: '①连词，所以/因此；②副词，故意/本来/仍然；③名词，缘故/旧的', example: '温故而知新', source: '《论语》' },
  '遂': { char: '遂', pinyin: 'suì', modern: '于是/就', classical: '①副词，于是/就/终于；②动词，成功/顺遂', example: '后遂无问津者', source: '《桃花源记》陶渊明' },
  '即': { char: '即', pinyin: 'jí', modern: '就是/马上', classical: '①动词，接近/就是；②副词，立刻/马上；③连词，即使', example: '即此爱之', source: '《世说新语》' },
  '盖': { char: '盖', pinyin: 'gài', modern: '大概', classical: '①副词，大概/原来是；②连词，发语词；③动词，超过', example: '盖儒者之所争', source: '《答司马谏议书》王安石' },
  '夫': { char: '夫', pinyin: 'fū/fú', modern: '丈夫', classical: '①助词，发语词；②指示代词，那/这；③名词，成年男子', example: '夫战，勇气也', source: '《曹刿论战》' },
  '唯': { char: '唯', pinyin: 'wéi', modern: '只/只有', classical: '①副词，只/只有/希望；②语气词，表恭敬', example: '唯江上之清风', source: '《前赤壁赋》苏轼' },
  '虽': { char: '虽', pinyin: 'suī', modern: '虽然', classical: '①连词，虽然/即使/纵然；②副词，虽然', example: '虽人有百口', source: '《口技》林嗣环' },
  '纵': { char: '纵', pinyin: 'zòng', modern: '即使', classical: '①连词，即使/纵然；②动词，放纵/释放', example: '纵一苇之所如', source: '《前赤壁赋》苏轼' },
  '岂': { char: '岂', pinyin: 'qǐ', modern: '难道', classical: '副词，难道/怎么/哪里（表反问）', example: '岂不罹此寒', source: '《咏怀》阮籍' },
  '宁': { char: '宁', pinyin: 'nìng', modern: '宁可', classical: '①副词，难道/岂/宁可；②形容词，安宁', example: '宁赴湘流', source: '《楚辞》屈原' },
  '胡': { char: '胡', pinyin: 'hú', modern: '为什么', classical: '①疑问代词，为什么/怎么；②名词，古代北方民族', example: '胡不归', source: '《诗经·式微》' },
  '何': { char: '何', pinyin: 'hé', modern: '什么/为什么', classical: '①疑问代词，什么/哪里/为什么/怎么样；②副词，多么', example: '何所似', source: '《世说新语》' },
  '奚': { char: '奚', pinyin: 'xī', modern: '为什么/哪里', classical: '疑问代词，什么/哪里/为什么', example: '奚惆怅而独悲', source: '《归去来兮辞》陶渊明' },
  '恶': { char: '恶', pinyin: 'wù/è', modern: '讨厌/坏', classical: '①动词，厌恶/讨厌；②疑问词，怎么；③形容词，坏的', example: '恶而不慈', source: '《孟子》' },
  '安': { char: '安', pinyin: 'ān', modern: '安全/哪里', classical: '①疑问代词，哪里/怎么；②形容词，安定/安稳；③动词，安放', example: '燕雀安知鸿鹄之志哉', source: '《陈涉世家》司马迁' },
  '孰': { char: '孰', pinyin: 'shú', modern: '谁/哪个', classical: '①疑问代词，谁/哪个/什么；②通"熟"，仔细', example: '孰能为之大', source: '《论语》' },
  '谁': { char: '谁', pinyin: 'shuí', modern: '什么人', classical: '疑问代词，什么人/谁', example: '谁言寸草心', source: '《游子吟》孟郊' },
  '曷': { char: '曷', pinyin: 'hé', modern: '什么/什么时候', classical: '疑问代词，什么/怎么/什么时候', example: '曷不委心任去留', source: '《归去来兮辞》陶渊明' },
  '尝': { char: '尝', pinyin: 'cháng', modern: '曾经', classical: '①副词，曾经；②动词，尝试/品尝', example: '尝求古仁人之心', source: '《岳阳楼记》范仲淹' },
  '曾': { char: '曾', pinyin: 'céng/zēng', modern: '曾经', classical: '①副词，曾经；②副词，竟然/连……都', example: '曾不若孀妻弱子', source: '《愚公移山》' },
  '但': { char: '但', pinyin: 'dàn', modern: '但是/只', classical: '①副词，只/只是/仅仅；②连词，但是', example: '但闻黄河流水鸣溅溅', source: '《木兰诗》' },
  '仅': { char: '仅', pinyin: 'jǐn/jìn', modern: '仅仅', classical: '①副词，只/仅仅/将近', example: '仅如银线', source: '《观潮》周密' },
  '莫': { char: '莫', pinyin: 'mò', modern: '不要/没有', classical: '①副词，不要/没有谁/没有什么；②否定副词，不', example: '莫道不消魂', source: '《醉花阴》李清照' },
  '勿': { char: '勿', pinyin: 'wù', modern: '不要', classical: '副词，不要/别（表示禁止或劝阻）', example: '勿以善小而不为', source: '《三国志》' },
  '未': { char: '未', pinyin: 'wèi', modern: '还没有', classical: '①副词，没有/不/尚未；②副词，表将来，不', example: '未尝不叹息', source: '《出师表》诸葛亮' },
  '已': { char: '已', pinyin: 'yǐ', modern: '已经/停止', classical: '①副词，已经；②动词，停止；③语气词，同"矣"', example: '已而夕阳在山', source: '《醉翁亭记》欧阳修' },
  '既': { char: '既', pinyin: 'jì', modern: '已经', classical: '①副词，已经/既然；②连词，既然；③动词，尽/完', example: '既克，公问其故', source: '《曹刿论战》' },
  '方': { char: '方', pinyin: 'fāng', modern: '方/正要', classical: '①副词，正当/将要/才；②名词，方法/方向', example: '方欲行', source: '《狼》蒲松龄' },
  '向': { char: '向', pinyin: 'xiàng', modern: '向着/从前', classical: '①介词，对着/朝向；②副词，从前/刚才；③连词，如果', example: '寻向所志', source: '《桃花源记》陶渊明' },
  '当': { char: '当', pinyin: 'dāng', modern: '应该/当', classical: '①动词，面对/担任/抵挡；②副词，将要/在；③介词，在', example: '当其南北分者', source: '《登泰山记》姚鼐' },
  '及': { char: '及', pinyin: 'jí', modern: '和/到', classical: '①介词，到/等到/和/比得上；②动词，赶上/涉及', example: '及郡下', source: '《桃花源记》陶渊明' },
  '适': { char: '适', pinyin: 'shì', modern: '适合/恰好', classical: '①动词，到……去/出嫁；②副词，恰好/刚才', example: '余自齐安舟行适临汝', source: '《石钟山记》苏轼' },
  '会': { char: '会', pinyin: 'huì', modern: '能/会议', classical: '①副词，适逢/将要；②动词，聚会/领会', example: '会宾客大宴', source: '《口技》林嗣环' },
  '辄': { char: '辄', pinyin: 'zhé', modern: '总是/就', classical: '副词，总是/就/往往/立即', example: '辄倾数家之产', source: '《促织》蒲松龄' },
  '素': { char: '素', pinyin: 'sù', modern: '白色/朴素', classical: '①副词，向来/平素；②形容词，白色的/朴素的', example: '素不相识', source: '《世说新语》' },
  '更': { char: '更', pinyin: 'gēng/gèng', modern: '更加/再', classical: '①副词，再/又/更加/还是；②动词，改变/经历', example: '欲穷千里目，更上一层楼', source: '《登鹳雀楼》王之涣' },
  '复': { char: '复', pinyin: 'fù', modern: '又/再', classical: '①副词，又/再/重新；②动词，恢复/回来', example: '复行数十步', source: '《桃花源记》陶渊明' },
  '犹': { char: '犹', pinyin: 'yóu', modern: '还/仍然', classical: '①副词，还/仍然/尚且；②动词，如同/好像', example: '犹得备晨炊', source: '《石壕吏》杜甫' },
  '尚': { char: '尚', pinyin: 'shàng', modern: '还/崇尚', classical: '①副词，还/仍然/尚且；②动词，崇尚/尊重', example: '尚安事贼', source: '《左传》' },
  '卒': { char: '卒', pinyin: 'zú/cù', modern: '终于/士兵', classical: '①副词，终于/最终；②名词，士兵/差役；③动词，死', example: '卒获有所闻', source: '《送东阳马生序》宋濂' },
  '竟': { char: '竟', pinyin: 'jìng', modern: '竟然/终于', classical: '①副词，竟然/终于/始终；②动词，完毕', example: '竟无语', source: '《雨霖铃》柳永' },
  '固': { char: '固', pinyin: 'gù', modern: '坚固/本来', classical: '①副词，本来/确实/坚决；②形容词，坚固', example: '余固笑而不信也', source: '《石钟山记》苏轼' },
  '许': { char: '许', pinyin: 'xǔ', modern: '许多/允许', classical: '①副词，大约；②动词，答应/赞同；③代词，这样', example: '潭中鱼可百许头', source: '《小石潭记》柳宗元' },
  '可': { char: '可', pinyin: 'kě', modern: '可以/能够', classical: '①副词，大约/可以/难道；②动词，许可', example: '潭中鱼可百许头', source: '《小石潭记》柳宗元' },
  '所': { char: '所', pinyin: 'suǒ', modern: '地方/处所', classical: '①助词，……的地方/……的事物；②名词，处所', example: '问所从来', source: '《桃花源记》陶渊明' },
  '然': { char: '然', pinyin: 'rán', modern: '这样/但是', classical: '①代词，这样/如此；②连词，但是/然而；③形容词词尾，……的样子', example: '然富贵而谄事其贵者', source: '《宋濂》' },
  '此': { char: '此', pinyin: 'cǐ', modern: '这个', classical: '代词，这/这个/这里/这样', example: '此则岳阳楼之大观也', source: '《岳阳楼记》范仲淹' },
  '彼': { char: '彼', pinyin: 'bǐ', modern: '那个', classical: '①代词，那/那个/对方；②副词，那/那个', example: '彼与彼年相若也', source: '《师说》韩愈' },
  '自': { char: '自', pinyin: 'zì', modern: '自己/从', classical: '①介词，从/由/在；②代词，自己；③副词，自然/亲自', example: '自富阳至桐庐', source: '《与朱元思书》吴均' },
  '身': { char: '身', pinyin: 'shēn', modern: '身体/自身', classical: '①名词，身体/自身/生命；②副词，亲自', example: '退亦忧则独善其身', source: '《孟子》' },
  '亲': { char: '亲', pinyin: 'qīn', modern: '亲人/亲近', classical: '①名词，父母/亲属；②副词，亲自；③形容词，亲近的', example: '亲贤臣，远小人', source: '《出师表》诸葛亮' },
  '国': { char: '国', pinyin: 'guó', modern: '国家', classical: '①名词，国家/国都/地区', example: '去国怀乡', source: '《岳阳楼记》范仲淹' },
  '家': { char: '家', pinyin: 'jiā', modern: '家庭/家', classical: '①名词，家庭/人家/学派', example: '率妻子邑人来此绝境', source: '《桃花源记》陶渊明' },
  '人': { char: '人', pinyin: 'rén', modern: '人', classical: '①名词，人/别人/人才', example: '先天下之忧而忧', source: '《岳阳楼记》范仲淹' },
  '民': { char: '民', pinyin: 'mín', modern: '人民/百姓', classical: '名词，人民/百姓/民众', example: '民殷国富', source: '《出师表》诸葛亮' },
  '君': { char: '君', pinyin: 'jūn', modern: '君子/您', classical: '①名词，君主/统治者；②对人的尊称', example: '君问归期未有期', source: '《夜雨寄北》李商隐' },
  '子': { char: '子', pinyin: 'zǐ', modern: '儿子/子女', classical: '①名词，儿女/弟子/先生；②对人的尊称', example: '子曰：学而时习之', source: '《论语》' },
  '士': { char: '士', pinyin: 'shì', modern: '人士/士兵', classical: '①名词，读书人/武士/官员', example: '士不可以不弘毅', source: '《论语》' },
  '师': { char: '师', pinyin: 'shī', modern: '老师/军队', classical: '①名词，老师/军队/众人', example: '师者，所以传道受业解惑也', source: '《师说》韩愈' },
  '生': { char: '生', pinyin: 'shēng', modern: '生命/出生', classical: '①名词，学生/先生；②动词，生长/生存；③形容词，生疏的', example: '生亦我所欲也', source: '《孟子》' },
  '学': { char: '学', pinyin: 'xué', modern: '学习', classical: '①动词，学习/模仿；②名词，学问/学校', example: '学而时习之', source: '《论语》' },
  '道': { char: '道', pinyin: 'dào', modern: '道路/道理', classical: '①名词，道路/道理/学说；②动词，说/讲；③动词，取道', example: '先天下之忧而忧', source: '《岳阳楼记》范仲淹' },
  '德': { char: '德', pinyin: 'dé', modern: '品德/恩德', classical: '①名词，品德/恩德/感激', example: '德不孤，必有邻', source: '《论语》' },
  '仁': { char: '仁', pinyin: 'rén', modern: '仁爱', classical: '名词，仁爱/仁义/仁德', example: '仁者乐山', source: '《论语》' },
  '义': { char: '义', pinyin: 'yì', modern: '正义/意义', classical: '①名词，正义/道义/意义', example: '舍生而取义者也', source: '《孟子》' },
  '礼': { char: '礼', pinyin: 'lǐ', modern: '礼貌/礼物', classical: '①名词，礼仪/礼节/礼貌', example: '不知礼，无以立也', source: '《论语》' },
  '信': { char: '信', pinyin: 'xìn', modern: '相信/信用', classical: '①动词，相信/信任；②名词，信用/使者；③副词，确实', example: '与朋友交而不信乎', source: '《论语》' },
  '忠': { char: '忠', pinyin: 'zhōng', modern: '忠诚', classical: '形容词，尽心尽力/忠诚', example: '为人谋而不忠乎', source: '《论语》' },
  '孝': { char: '孝', pinyin: 'xiào', modern: '孝顺', classical: '形容词/名词，孝顺/孝道', example: '孝弟也者，其为仁之本与', source: '《论语》' },
  '善': { char: '善', pinyin: 'shàn', modern: '善良/好', classical: '①形容词，好/善良/擅长；②动词，善于/赞许', example: '择其善者而从之', source: '《论语》' },
  '美': { char: '美', pinyin: 'měi', modern: '美丽/美好', classical: '①形容词，美丽/美好/善良；②动词，赞美', example: '吾妻之美我者', source: '《邹忌讽齐王纳谏》' },
  '真': { char: '真', pinyin: 'zhēn', modern: '真实/真正', classical: '①形容词，真实/真诚；②副词，确实/真的', example: '此真汉贼也', source: '《三国志》' },
  '实': { char: '实', pinyin: 'shí', modern: '真实/实际', classical: '①形容词，真实/充实；②副词，确实/其实', example: '其实味不同', source: '《晏子使楚》' },
  '名': { char: '名', pinyin: 'míng', modern: '名字/名声', classical: '①名词，名字/名声/名义；②动词，命名/出名', example: '山不在高，有仙则名', source: '《陋室铭》刘禹锡' },
  '利': { char: '利', pinyin: 'lì', modern: '利益/锋利', classical: '①名词，利益/好处；②形容词，锋利/敏捷', example: '因势利导', source: '《史记》' },
  '害': { char: '害', pinyin: 'hài', modern: '伤害/害处', classical: '①动词，伤害/杀害/妨碍；②名词，害处/祸害', example: '不以害其生', source: '《庄子》' },
  '功': { char: '功', pinyin: 'gōng', modern: '功劳/功绩', classical: '①名词，功业/功劳/成效', example: '功亏一篑', source: '《尚书》' },
  '劳': { char: '劳', pinyin: 'láo', modern: '劳动/劳累', classical: '①动词，劳动/使……劳累；②形容词，劳苦/功绩', example: '劳其筋骨', source: '《孟子》' },
  '苦': { char: '苦', pinyin: 'kǔ', modern: '痛苦/辛苦', classical: '①形容词，苦/辛苦/痛苦；②动词，使……苦', example: '必先苦其心志', source: '《孟子》' },
  '乐': { char: '乐', pinyin: 'lè/yuè', modern: '快乐/音乐', classical: '①动词，以……为乐；②名词，快乐/音乐', example: '有朋自远方来，不亦乐乎', source: '《论语》' },
  '忧': { char: '忧', pinyin: 'yōu', modern: '忧愁/担心', classical: '①动词，担忧/忧虑；②名词，忧愁/忧患', example: '先天下之忧而忧', source: '《岳阳楼记》范仲淹' },
  '喜': { char: '喜', pinyin: 'xǐ', modern: '高兴/喜欢', classical: '①动词，高兴/喜爱；②名词，喜事/喜庆', example: '不以物喜', source: '《岳阳楼记》范仲淹' },
  '怒': { char: '怒', pinyin: 'nù', modern: '愤怒', classical: '①动词，发怒/愤怒；②形容词，气势强盛', example: '发上指冠', source: '《史记》' },
  '哀': { char: '哀', pinyin: 'āi', modern: '悲伤/哀叹', classical: '①形容词，悲伤/可怜；②动词，哀叹/同情', example: '哀民生之多艰', source: '《离骚》屈原' },
  '思': { char: '思', pinyin: 'sī', modern: '思考/思念', classical: '①动词，思考/思念/想；②名词，思绪/情怀', example: '学而不思则罔', source: '《论语》' },
  '欲': { char: '欲', pinyin: 'yù', modern: '想要/欲望', classical: '①动词，想要/希望；②名词，欲望；③副词，将要', example: '欲穷千里目', source: '《登鹳雀楼》王之涣' },
  '感': { char: '感', pinyin: 'gǎn', modern: '感觉/感动', classical: '①动词，感动/感觉/感激；②名词，感慨', example: '感时花溅泪', source: '《春望》杜甫' },
  '知': { char: '知', pinyin: 'zhī', modern: '知道/知识', classical: '①动词，知道/了解/主持；②名词，知识/知觉', example: '知之为知之', source: '《论语》' },
  '见': { char: '见', pinyin: 'jiàn/xiàn', modern: '看见/见面', classical: '①动词，看见/会见/被；②名词，见解/见识', example: '见两小儿辩斗', source: '《列子》' },
  '闻': { char: '闻', pinyin: 'wén', modern: '听见/新闻', classical: '①动词，听见/听说/闻名；②名词，见闻/名声', example: '闻鸡起舞', source: '《晋书》' },
  '问': { char: '问', pinyin: 'wèn', modern: '询问/问题', classical: '①动词，询问/慰问/追究', example: '问今是何世', source: '《桃花源记》陶渊明' },
  '答': { char: '答', pinyin: 'dá', modern: '回答/答复', classical: '动词，回答/答复/应对', example: '渔人甚异之，欲穷其林', source: '《桃花源记》陶渊明' },
  '言': { char: '言', pinyin: 'yán', modern: '说话/言语', classical: '①动词，说/讲；②名词，话/言语/言论', example: '知无不言，言无不尽', source: '《左传》' },
  '语': { char: '语', pinyin: 'yǔ/yù', modern: '说话/语言', classical: '①动词，告诉/说话；②名词，话语/谚语', example: '此中人语云', source: '《桃花源记》陶渊明' },
  '书': { char: '书', pinyin: 'shū', modern: '书籍/书信', classical: '①名词，书籍/书信；②动词，书写', example: '烽火连三月，家书抵万金', source: '《春望》杜甫' },
  '文': { char: '文', pinyin: 'wén', modern: '文字/文章', classical: '①名词，文字/文章/文化；②动词，修饰', example: '文以载道', source: '《通书·文辞》' },
  '诗': { char: '诗', pinyin: 'shī', modern: '诗歌', classical: '名词，诗歌/诗经', example: '诗言志', source: '《尚书》' },
  '歌': { char: '歌', pinyin: 'gē', modern: '歌曲/唱歌', classical: '①动词，唱歌/歌颂；②名词，歌曲/诗歌', example: '歌以咏志', source: '《观沧海》曹操' },
  '风': { char: '风', pinyin: 'fēng', modern: '风', classical: '①名词，风/风格/风俗；②动词，吹风/教化', example: '风萧萧兮易水寒', source: '《史记》' },
  '花': { char: '花', pinyin: 'huā', modern: '花朵', classical: '①名词，花朵/花纹；②动词，开花/花费', example: '花间一壶酒', source: '《月下独酌》李白' },
  '月': { char: '月', pinyin: 'yuè', modern: '月亮', classical: '名词，月亮/月份', example: '月出皎兮', source: '《诗经·月出》' },
  '日': { char: '日', pinyin: 'rì', modern: '太阳/日子', classical: '①名词，太阳/日子/时间', example: '白日依山尽', source: '《登鹳雀楼》王之涣' },
  '山': { char: '山', pinyin: 'shān', modern: '山', classical: '①名词，山/山岳/山峰', example: '山不在高，有仙则名', source: '《陋室铭》刘禹锡' },
  '水': { char: '水', pinyin: 'shuǐ', modern: '水', classical: '①名词，水/河流/水平', example: '山高月小，水落石出', source: '《后赤壁赋》苏轼' },
  '云': { char: '云', pinyin: 'yún', modern: '云彩/说', classical: '①名词，云彩；②动词，说', example: '云想衣裳花想容', source: '《清平调》李白' },
  '雨': { char: '雨', pinyin: 'yǔ', modern: '雨', classical: '①名词，雨；②动词，下雨/润泽', example: '好雨知时节', source: '《春夜喜雨》杜甫' },
  '雪': { char: '雪', pinyin: 'xuě', modern: '雪', classical: '①名词，雪；②动词，下雪/洗刷', example: '窗含西岭千秋雪', source: '《绝句》杜甫' },
  '春': { char: '春', pinyin: 'chūn', modern: '春天', classical: '名词，春天/生机/青春', example: '春眠不觉晓', source: '《春晓》孟浩然' },
  '秋': { char: '秋', pinyin: 'qiū', modern: '秋天', classical: '①名词，秋天/时期/年', example: '秋风萧瑟，洪波涌起', source: '《观沧海》曹操' },
  '天': { char: '天', pinyin: 'tiān', modern: '天空/天', classical: '①名词，天空/上天/天气', example: '天门中断楚江开', source: '《望天门山》李白' },
  '地': { char: '地', pinyin: 'dì', modern: '地面/地方', classical: '①名词，土地/地方/地位', example: '城春草木深', source: '《春望》杜甫' },
  '古': { char: '古', pinyin: 'gǔ', modern: '古代/古老', classical: '形容词，古代的/古老的/质朴的', example: '前不见古人', source: '《登幽州台歌》陈子昂' },
  '今': { char: '今', pinyin: 'jīn', modern: '今天/现在', classical: '①名词，现在/今天/当今', example: '今人不见古时月', source: '《把酒问月》李白' },
  '前': { char: '前', pinyin: 'qián', modern: '前面/以前', classical: '①名词，前面/以前；②动词，前进', example: '前不见古人', source: '《登幽州台歌》陈子昂' },
  '后': { char: '后', pinyin: 'hòu', modern: '后面/以后', classical: '①名词，后面/后代/君主；②动词，落后', example: '后天下之乐而乐', source: '《岳阳楼记》范仲淹' },
  '上': { char: '上', pinyin: 'shàng', modern: '上面/上', classical: '①名词，上面/上级/皇上；②动词，登上/进献', example: '更上一层楼', source: '《登鹳雀楼》王之涣' },
  '下': { char: '下', pinyin: 'xià', modern: '下面/下', classical: '①名词，下面/下级；②动词，放下/攻下', example: '山下兰芽短浸溪', source: '《浣溪沙》苏轼' },
  '中': { char: '中', pinyin: 'zhōng', modern: '中间/里面', classical: '①名词，中间/里面/内情；②动词，中中/符合', example: '中军置酒饮归客', source: '《白雪歌》岑参' },
  '大': { char: '大', pinyin: 'dà', modern: '大', classical: '①形容词，大的/重要的/年长的；②副词，很/非常', example: '大漠孤烟直', source: '《使至塞上》王维' },
  '小': { char: '小', pinyin: 'xiǎo', modern: '小', classical: '①形容词，小的/年幼的/低微的', example: '小荷才露尖尖角', source: '《小池》杨万里' },
  '多': { char: '多', pinyin: 'duō', modern: '多', classical: '①形容词，多的/丰富的；②副词，常常/多半', example: '山不在高，有仙则名', source: '《陋室铭》刘禹锡' },
  '少': { char: '少', pinyin: 'shǎo/shào', modern: '少', classical: '①形容词，少的/年幼的；②副词，稍微', example: '少壮不努力', source: '《长歌行》' },
  '长': { char: '长', pinyin: 'cháng/zhǎng', modern: '长/生长', classical: '①形容词，长的/久远的/高大的；②动词，生长/掌管', example: '白发三千丈', source: '《秋浦歌》李白' },
  '短': { char: '短', pinyin: 'duǎn', modern: '短', classical: '形容词，短的/不足的/缺点', example: '短褐穿结', source: '《论语》' },
  '高': { char: '高', pinyin: 'gāo', modern: '高', classical: '①形容词，高的/高明的/高尚的', example: '山不在高，有仙则名', source: '《陋室铭》刘禹锡' },
  '远': { char: '远', pinyin: 'yuǎn', modern: '远', classical: '①形容词，远的/深远的；②动词，远离', example: '有朋自远方来', source: '《论语》' },
  '近': { char: '近', pinyin: 'jìn', modern: '近', classical: '①形容词，近的/亲近的；②动词，接近/靠近', example: '近乡情更怯', source: '《渡汉江》宋之问' },
  '深': { char: '深', pinyin: 'shēn', modern: '深', classical: '①形容词，深的/深刻的/久远的；②副词，很/非常', example: '桃花潭水深千尺', source: '《赠汪伦》李白' },
  '浅': { char: '浅', pinyin: 'qiǎn', modern: '浅', classical: '形容词，浅的/短浅的/肤浅的', example: '浅草才能没马蹄', source: '《钱塘湖春行》白居易' },
  '空': { char: '空', pinyin: 'kōng/kòng', modern: '空', classical: '①形容词，空的/空虚的；②副词，白白地；③名词，天空', example: '空山新雨后', source: '《山居秋暝》王维' },
  '满': { char: '满', pinyin: 'mǎn', modern: '满', classical: '①形容词，满的/充实的；②动词，使……满/满足', example: '满园春色关不住', source: '《游园不值》叶绍翁' },
  '开': { char: '开', pinyin: 'kāi', modern: '打开/开始', classical: '①动词，打开/开辟/开放；②形容词，开阔', example: '开轩面场圃', source: '《过故人庄》孟浩然' },
  '落': { char: '落', pinyin: 'luò', modern: '落下/落后', classical: '①动词，落下/衰败/停留；②名词，村落/院落', example: '落花人独立', source: '《临江仙》晏几道' },
  '飞': { char: '飞', pinyin: 'fēi', modern: '飞', classical: '①动词，飞翔/飞散/飞快；②形容词，快速的', example: '两个黄鹂鸣翠柳', source: '《绝句》杜甫' },
  '行': { char: '行', pinyin: 'xíng/háng', modern: '走/行业', classical: '①动词，行走/做/运行；②名词，行列/品行', example: '三人行，必有我师焉', source: '《论语》' },
  '走': { char: '走', pinyin: 'zǒu', modern: '走/跑', classical: '①动词，跑/逃跑/走向', example: '双兔傍地走', source: '《木兰诗》' },
  '立': { char: '立', pinyin: 'lì', modern: '站立/建立', classical: '①动词，站立/竖立/建立；②副词，立刻', example: '立身以立学为先', source: '《宋史》' },
  '坐': { char: '坐', pinyin: 'zuò', modern: '坐/座位', classical: '①动词，坐下/乘坐；②因为；③定罪', example: '停车坐爱枫林晚', source: '《山行》杜牧' },
  '卧': { char: '卧', pinyin: 'wò', modern: '躺/卧', classical: '动词，躺下/趴下/隐居', example: '卧看牵牛织女星', source: '《秋夕》杜牧' },
  '去': { char: '去', pinyin: 'qù', modern: '去/离开', classical: '①动词，离开/距离/除去', example: '去国怀乡', source: '《岳阳楼记》范仲淹' },
  '来': { char: '来', pinyin: 'lái', modern: '来', classical: '①动词，来/来到/招来；②语气词，表将来', example: '有朋自远方来', source: '《论语》' },
  '归': { char: '归', pinyin: 'guī', modern: '回来/归属', classical: '①动词，返回/归还/归属；②名词，归宿', example: '微斯人，吾谁与归', source: '《岳阳楼记》范仲淹' },
  '出': { char: '出', pinyin: 'chū', modern: '出去/出现', classical: '①动词，出去/发出/超出；②名词，出处', example: '日出而林霏开', source: '《醉翁亭记》欧阳修' },
  '入': { char: '入', pinyin: 'rù', modern: '进入', classical: '①动词，进入/参加/收入；②名词，收入', example: '入则无法家拂士', source: '《孟子》' },
  '过': { char: '过', pinyin: 'guò', modern: '经过/过错', classical: '①动词，经过/超过/犯错；②名词，过错', example: '人恒过，然后能改', source: '《孟子》' },
  '还': { char: '还', pinyin: 'huán/hái', modern: '回来/还是', classical: '①动词，返回/归还/回报；②副词，仍然/还是', example: '还来就菊花', source: '《过故人庄》孟浩然' },
  '住': { char: '住', pinyin: 'zhù', modern: '居住/停止', classical: '①动词，居住/停留/停止', example: '停车坐爱枫林晚', source: '《山行》杜牧' },
  '望': { char: '望', pinyin: 'wàng', modern: '希望/眺望', classical: '①动词，眺望/期望/声望；②名词，希望/名望', example: '望峰息心', source: '《与朱元思书》吴均' },
  '看': { char: '看', pinyin: 'kàn/kān', modern: '看', classical: '①动词，观看/探望/照料', example: '看万山红遍', source: '《沁园春·雪》毛泽东' },
  '听': { char: '听', pinyin: 'tīng', modern: '听', classical: '①动词，听见/听从/任凭', example: '但闻黄河流水鸣溅溅', source: '《木兰诗》' },
  '饮': { char: '饮', pinyin: 'yǐn', modern: '喝/饮料', classical: '①动词，喝/饮酒/使……喝；②名词，饮料', example: '中军置酒饮归客', source: '《白雪歌》岑参' },
  '食': { char: '食', pinyin: 'shí/sì', modern: '吃/食物', classical: '①动词，吃/喂养；②名词，食物/粮食', example: '食不饱，力不足', source: '《马说》韩愈' },
  '衣': { char: '衣', pinyin: 'yī', modern: '衣服', classical: '①名词，衣服；②动词，穿/披', example: '衣带渐宽终不悔', source: '《蝶恋花》柳永' },
  '起': { char: '起', pinyin: 'qǐ', modern: '起来/开始', classical: '①动词，起来/起身/兴起', example: '闻鸡起舞', source: '《晋书》' },
}

var COMMON_CHARS = Object.keys(DICTIONARY)

function CharInfoPanel({ entry, charInfo, onAIQuery, aiLoading }: { entry: WordEntry; charInfo: any; onAIQuery: () => void; aiLoading: boolean }) {
  var isInDict = DICTIONARY[entry.char]
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-baseline gap-3">
          <span className="text-3xl font-bold">{entry.char}</span>
          <span className="text-sm text-muted-foreground">{entry.pinyin}</span>
          {charInfo && charInfo.strokeCount > 0 && (
            <span className="text-xs text-muted-foreground">{charInfo.strokeCount}画</span>
          )}
        </div>
        <div className="space-y-2.5">
          <div>
            <div className="mb-1 text-xs font-medium text-primary">现代释义</div>
            <div className="text-sm leading-relaxed">{entry.modern}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-primary">文言释义</div>
            <div className="text-sm leading-relaxed">{entry.classical}</div>
          </div>
        </div>
      </div>
      {!isInDict && (
        <button onClick={onAIQuery} disabled={aiLoading}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          {aiLoading ? 'AI 查询中...' : 'AI 查询详细释义'}
        </button>
      )}
      {entry.example && (
        <div className="rounded-xl bg-muted/50 px-4 py-3">
          <div className="mb-1 text-xs font-medium text-muted-foreground">古诗词用例</div>
          <div className="text-sm font-medium leading-relaxed">「{entry.example}」</div>
          <div className="mt-1 text-xs text-muted-foreground">—— {entry.source}</div>
        </div>
      )}
    </div>
  )
}

export default function WordMeaningPanel() {
  var [query, setQuery] = useState('')
  var [result, setResult] = useState<WordEntry | null>(null)
  var [charInfo, setCharInfo] = useState<any>(null)
  var [error, setError] = useState('')
  var [loading, setLoading] = useState(false)
  var [aiLoading, setAiLoading] = useState(false)
  var [history, setHistory] = useState<WordEntry[]>([])
  var inputRef = useRef<HTMLInputElement>(null)

  var handleLookup = useCallback(async function() {
    var q = (inputRef.current?.value || '').trim()
    if (!q) return
    setQuery(q)
    setLoading(true)
    setError('')
    setResult(null)
    setCharInfo(null)
    try {
      var chars = q.split('')
      var valid = chars.filter(function(c) { return /[\u4e00-\u9fff]/.test(c) })
      if (valid.length === 0) {
        setError('请输入至少一个汉字')
        setLoading(false)
        return
      }
      var mainChar = valid[0]
      var entry = DICTIONARY[mainChar]
      if (!entry) {
        var pinyin = ''
        try {
          var pinyinPro = await import('pinyin-pro')
          pinyin = String(pinyinPro.pinyin(mainChar, { toneType: 'symbol', multiple: true }))
        } catch { pinyin = '' }
        entry = { char: mainChar, pinyin: pinyin, modern: '（未收录）', classical: '可点击下方按钮通过 AI 查询', example: '', source: '' }
      }
      setResult(entry)
      setHistory(function(prev) {
        var next = [entry!, ...prev.filter(function(h) { return h.char !== entry!.char })].slice(0, 20)
        return next
      })
      try {
        var cnchar = (await import('cnchar')).default
        await import('cnchar-order')
        var strokes = cnchar.stroke(mainChar, 'order')
        var strokeCount = Array.isArray(strokes) ? strokes.length : (typeof strokes === 'number' ? strokes : 0)
        setCharInfo({ strokeCount: strokeCount })
      } catch {
        setCharInfo(null)
      }
    } catch {
      setError('查询出错，请重试')
    } finally {
      setLoading(false)
    }
  }, [])

  var handleAIQuery = useCallback(async function() {
    if (!result) return
    setAiLoading(true)
    setError('')
    try {
      var aiConfigs = useStore.getState().aiConfigs
      var cfg = aiConfigs.find(function(c) { return c.enabled && c.apiKey })
      if (!cfg) { throw new Error('请在设置中配置 AI 平台和 API Key') }
      var reply = await chat(cfg.platform, cfg.apiKey, [
        { role: 'system', content: '你是古汉语词典助手。请查询汉字在文言文中的用法。用以下JSON格式回复，不要添加任何其他内容：{"modern":"现代释义","classical":"文言释义（含多个义项）","example":"古诗词中的例句","source":"出处"}' },
        { role: 'user', content: result.char },
      ], cfg.model)
      var parsed = JSON.parse(reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      var updated = { ...result, modern: parsed.modern || result.modern, classical: parsed.classical || result.classical, example: parsed.example || result.example, source: parsed.source || result.source }
      setResult(updated)
      setHistory(function(prev) {
        return prev.map(function(h) { return h.char === updated.char ? updated : h })
      })
    } catch (err: any) {
      setError(err.message || 'AI 查询失败')
    } finally {
      setAiLoading(false)
    }
  }, [result])

  var handleKeyDown = function(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleLookup()
  }

  var clearHistory = function() { setHistory([]) }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        查询汉字或词语的文言文释义和古诗词用例。输入单个汉字或 2-4 字词语。
      </div>

      <div className="flex gap-2">
        <input ref={inputRef} onKeyDown={handleKeyDown} placeholder="输入汉字或词语..."
          maxLength={4} className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <button onClick={handleLookup} disabled={loading || !query.trim()}
          className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
          {loading ? '查询中...' : '查询'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{error}</div>
      )}

      {result && <CharInfoPanel entry={result} charInfo={charInfo} onAIQuery={handleAIQuery} aiLoading={aiLoading} />}

      {history.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">查询历史（{history.length}）</span>
            <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">清空</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {history.map(function(h) {
              return (
                <button key={h.char} onClick={function() { if (inputRef.current) inputRef.current.value = h.char; setQuery(h.char); setResult(h); setCharInfo(null) }}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs transition-colors hover:bg-accent">
                  <span className="font-medium">{h.char}</span>
                  <span className="text-muted-foreground">{h.pinyin}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {COMMON_CHARS.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">常用文言虚词（点击查看释义）</div>
          <div className="flex flex-wrap gap-1">
            {COMMON_CHARS.slice(0, 60).map(function(c) {
              return (
                <button key={c} onClick={function() { if (inputRef.current) inputRef.current.value = c; setQuery(c); setResult(DICTIONARY[c]); setCharInfo(null) }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-sm transition-colors hover:bg-accent hover:text-foreground">
                  {c}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
