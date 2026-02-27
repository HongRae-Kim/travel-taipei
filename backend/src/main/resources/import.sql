-- =============================================
-- Phrase 초기 데이터
-- =============================================

-- AIRPORT (공항)
INSERT INTO phrase (category, korean, chinese, pronunciation, sort_order) VALUES
('AIRPORT', '수하물은 어디서 찾나요?', '行李在哪裡領取？', 'Xínglǐ zài nǎlǐ lǐngqǔ?', 1),
('AIRPORT', '입국신고서를 작성해야 하나요?', '我需要填寫入境申報表嗎？', 'Wǒ xūyào tiánxiě rùjìng shēnbào biǎo ma?', 2),
('AIRPORT', '환전소는 어디에 있나요?', '哪裡可以換錢？', 'Nǎlǐ kěyǐ huàn qián?', 3),
('AIRPORT', '시내까지 어떻게 가나요?', '怎麼去市區？', 'Zěnme qù shìqū?', 4),
('AIRPORT', '유심 카드는 어디서 구입하나요?', '哪裡可以買SIM卡？', 'Nǎlǐ kěyǐ mǎi SIM kǎ?', 5);

-- TRANSPORT (교통)
INSERT INTO phrase (category, korean, chinese, pronunciation, sort_order) VALUES
('TRANSPORT', '~까지 가주세요.', '請帶我去～。', 'Qǐng dài wǒ qù ~.', 1),
('TRANSPORT', '여기서 세워주세요.', '請在這裡停車。', 'Qǐng zài zhèlǐ tíngchē.', 2),
('TRANSPORT', '이 역에서 내리면 되나요?', '我要在這站下車嗎？', 'Wǒ yào zài zhè zhàn xià chē ma?', 3),
('TRANSPORT', '다음 역이 어디인가요?', '下一站是哪裡？', 'Xià yī zhàn shì nǎlǐ?', 4),
('TRANSPORT', '편도로 한 장 주세요.', '請給我一張單程票。', 'Qǐng gěi wǒ yī zhāng dānchéng piào.', 5),
('TRANSPORT', '이 버스가 ~에 가나요?', '這輛公車有去～嗎？', 'Zhè liàng gōngchē yǒu qù ~ ma?', 6);

-- HOTEL (숙소)
INSERT INTO phrase (category, korean, chinese, pronunciation, sort_order) VALUES
('HOTEL', '체크인하고 싶어요.', '我想辦理入住。', 'Wǒ xiǎng bànlǐ rùzhù.', 1),
('HOTEL', '체크아웃하고 싶어요.', '我想辦理退房。', 'Wǒ xiǎng bànlǐ tuìfáng.', 2),
('HOTEL', '와이파이 비밀번호가 무엇인가요?', 'WiFi密碼是什麼？', 'WiFi mìmǎ shì shénme?', 3),
('HOTEL', '수건을 더 주실 수 있나요?', '可以再給我一條毛巾嗎？', 'Kěyǐ zài gěi wǒ yī tiáo máojīn ma?', 4),
('HOTEL', '짐을 맡길 수 있나요?', '我可以寄放行李嗎？', 'Wǒ kěyǐ jìfàng xínglǐ ma?', 5);

-- RESTAURANT (음식점)
INSERT INTO phrase (category, korean, chinese, pronunciation, sort_order) VALUES
('RESTAURANT', '메뉴를 보여주세요.', '請給我看菜單。', 'Qǐng gěi wǒ kàn càidān.', 1),
('RESTAURANT', '이걸로 주세요.', '我要這個。', 'Wǒ yào zhège.', 2),
('RESTAURANT', '물 주세요.', '請給我水。', 'Qǐng gěi wǒ shuǐ.', 3),
('RESTAURANT', '계산서 주세요.', '請給我帳單。', 'Qǐng gěi wǒ zhàngdān.', 4),
('RESTAURANT', '맵지 않게 해주세요.', '請不要太辣。', 'Qǐng bùyào tài là.', 5),
('RESTAURANT', '포장해 주실 수 있나요?', '可以打包嗎？', 'Kěyǐ dǎbāo ma?', 6);

-- SHOPPING (쇼핑)
INSERT INTO phrase (category, korean, chinese, pronunciation, sort_order) VALUES
('SHOPPING', '얼마예요?', '這個多少錢？', 'Zhège duōshǎo qián?', 1),
('SHOPPING', '깎아주실 수 있나요?', '可以便宜一點嗎？', 'Kěyǐ piányí yīdiǎn ma?', 2),
('SHOPPING', '카드로 결제해도 되나요?', '可以刷卡嗎？', 'Kěyǐ shuā kǎ ma?', 3),
('SHOPPING', '영수증 주세요.', '請給我收據。', 'Qǐng gěi wǒ shōujù.', 4),
('SHOPPING', '이것을 입어볼 수 있나요?', '我可以試穿嗎？', 'Wǒ kěyǐ shì chuān ma?', 5),
('SHOPPING', '다른 색상이 있나요?', '有其他顏色嗎？', 'Yǒu qítā yánsè ma?', 6);

-- EMERGENCY (긴급상황)
INSERT INTO phrase (category, korean, chinese, pronunciation, sort_order) VALUES
('EMERGENCY', '도와주세요!', '救命啊！', 'Jiùmìng a!', 1),
('EMERGENCY', '병원이 어디인가요?', '醫院在哪裡？', 'Yīyuàn zài nǎlǐ?', 2),
('EMERGENCY', '경찰을 불러주세요.', '請叫警察。', 'Qǐng jiào jǐngchá.', 3),
('EMERGENCY', '약국이 어디인가요?', '藥局在哪裡？', 'Yàojú zài nǎlǐ?', 4),
('EMERGENCY', '여권을 잃어버렸어요.', '我的護照丟了。', 'Wǒ de hùzhào diū le.', 5),
('EMERGENCY', '한국 대사관에 연락해야 해요.', '我需要聯絡韓國大使館。', 'Wǒ xūyào liánluò hánguó dàshǐguǎn.', 6);
