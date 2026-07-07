-- Seed: catalog expansion. 14 new bilingual published packages with media
-- and routes; itineraries and departures are derived set-based from the
-- routes so every package (new and pre-existing) gets a full bilingual
-- day-by-day plan and a realistic departure calendar.
-- Deterministic ids d0000000-0000-4000-8000-*. Idempotent via ON CONFLICT /
-- NOT EXISTS guards.
-- Runs with service_role claims so the deliberate write-guard triggers
-- (enforce_package_update_guard) recognize the sanctioned seeding path.
select set_config('request.jwt.claims', '{"role":"service_role"}', false);

insert into public.packages (id, agency_id, title, title_ar, description, description_ar, destination, destination_ar, duration_days, duration_nights, base_price, max_participants, difficulty_level, category, inclusions, inclusions_ar, exclusions, exclusions_ar, featured, created_at)
values
('d0000000-0000-4000-8000-000000000001', 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e', 'Italian Renaissance Journey', 'رحلة عصر النهضة الإيطالية', 'Walk through two thousand years of art and history across Rome, Florence and Venice — from the Colosseum and Vatican museums to Renaissance galleries and gondola-laced canals.', 'تجوّل عبر ألفي عام من الفن والتاريخ في روما وفلورنسا والبندقية — من الكولوسيوم ومتاحف الفاتيكان إلى معارض عصر النهضة وقنوات الجندول الساحرة.', 'Italy', 'إيطاليا', 8, 7, 1890, 18, 'easy', 'cultural', array['7 nights in 4-star hotels', 'Daily breakfast', 'High-speed train between cities', 'Skip-the-line museum tickets', 'Licensed local guides']::text[], array['7 ليالٍ في فنادق 4 نجوم', 'إفطار يومي', 'قطار سريع بين المدن', 'تذاكر متاحف بدون طوابير', 'مرشدون محليون مرخّصون']::text[], array['International flights', 'Lunches and dinners', 'Travel insurance']::text[], array['الرحلات الدولية', 'وجبات الغداء والعشاء', 'تأمين السفر']::text[], true, now() - interval '49 days'),
('d0000000-0000-4000-8000-000000000002', 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e', 'Tuscany Wine & Countryside', 'توسكانا: النبيذ والريف', 'Slow travel through rolling Tuscan hills: medieval hilltop towns, family-run vineyards, olive groves and long farmhouse lunches under the cypress trees.', 'سفر هادئ عبر تلال توسكانا: بلدات قروسطية فوق التلال، ومزارع كروم عائلية، وبساتين زيتون، ووجبات ريفية طويلة تحت أشجار السرو.', 'Italy', 'إيطاليا', 6, 5, 1450, 12, 'easy', 'luxury', array['5 nights in a countryside villa', 'Daily breakfast', '3 vineyard tastings', 'Cooking class in Siena', 'Private minivan']::text[], array['5 ليالٍ في فيلا ريفية', 'إفطار يومي', '3 جولات تذوّق في مزارع الكروم', 'درس طبخ في سيينا', 'حافلة صغيرة خاصة']::text[], array['Flights', 'City taxes', 'Personal expenses']::text[], array['الطيران', 'ضرائب المدن', 'المصاريف الشخصية']::text[], false, now() - interval '58 days'),
('d0000000-0000-4000-8000-000000000003', 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e', 'Turquoise Coast Sailing', 'الإبحار على الساحل الفيروزي', 'A gulet cruise along Turkey''s Turquoise Coast: hidden coves, ancient Lycian ruins, turquoise swimming stops and sunset dinners on deck.', 'رحلة بحرية بمركب القوليت على ساحل تركيا الفيروزي: خلجان مخفية، وآثار ليكية قديمة، ومحطات سباحة فيروزية، وعشاء على سطح المركب عند الغروب.', 'Turkey', 'تركيا', 7, 6, 1620, 14, 'easy', 'beach', array['6 nights aboard a private gulet', 'Full board meals', 'Snorkeling gear', 'Marina transfers', 'English/Arabic-speaking crew']::text[], array['6 ليالٍ على متن قوليت خاص', 'إقامة شاملة الوجبات', 'معدات الغطس', 'نقل من وإلى المرسى', 'طاقم يتحدث الإنجليزية والعربية']::text[], array['Flights to Dalaman', 'Alcoholic drinks', 'Shore excursions marked optional']::text[], array['الطيران إلى دالامان', 'المشروبات الكحولية', 'الجولات البرية الاختيارية']::text[], false, now() - interval '67 days'),
('d0000000-0000-4000-8000-000000000004', 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e', 'Halong Bay Luxury Cruise', 'رحلة فاخرة في خليج ها لونغ', 'Two nights among the limestone karsts of Halong Bay on a boutique cruise, plus Hanoi''s Old Quarter street food and colonial architecture.', 'ليلتان بين الصخور الجيرية في خليج ها لونغ على متن سفينة فاخرة، مع أطعمة الشوارع في الحي القديم بهانوي وعمارتها الكولونيالية.', 'Vietnam', 'فيتنام', 5, 4, 1180, 16, 'easy', 'luxury', array['2 nights aboard cruise + 2 nights hotel', 'All meals on board', 'Kayaking in the bay', 'Hanoi street-food tour', 'Airport transfers']::text[], array['ليلتان على متن السفينة + ليلتان في فندق', 'جميع الوجبات على المتن', 'التجديف بالكاياك في الخليج', 'جولة أطعمة الشوارع في هانوي', 'نقل من وإلى المطار']::text[], array['International flights', 'Vietnam visa', 'Drinks']::text[], array['الرحلات الدولية', 'تأشيرة فيتنام', 'المشروبات']::text[], true, now() - interval '76 days'),
('d0000000-0000-4000-8000-000000000005', 'e1f3b5b0-e2d2-44fe-b3d3-897f24fc367e', 'Japan Golden Route', 'الطريق الذهبي في اليابان', 'The classic first-timer''s Japan: Tokyo''s neon districts, Mount Fuji views from Hakone, Kyoto''s temples and geisha lanes, and the bullet train between them.', 'اليابان الكلاسيكية لزوّارها الجدد: أحياء طوكيو المضيئة، وإطلالات جبل فوجي من هاكوني، ومعابد كيوتو وأزقّة الغيشا، وقطار الشينكانسن السريع بينها.', 'Japan', 'اليابان', 9, 8, 2450, 16, 'easy', 'cultural', array['8 nights in 4-star hotels', 'Japan Rail Pass (7 days)', 'Daily breakfast', 'Guided days in Tokyo and Kyoto', 'Onsen evening in Hakone']::text[], array['8 ليالٍ في فنادق 4 نجوم', 'تذكرة قطارات اليابان (7 أيام)', 'إفطار يومي', 'أيام بصحبة مرشد في طوكيو وكيوتو', 'أمسية أونسن في هاكوني']::text[], array['International flights', 'Most lunches and dinners', 'Personal expenses']::text[], array['الرحلات الدولية', 'معظم وجبات الغداء والعشاء', 'المصاريف الشخصية']::text[], true, now() - interval '85 days'),
('d0000000-0000-4000-8000-000000000006', '94edd52e-2ec5-4337-8562-1f498814dc43', 'Cappadocia Balloons & Caves', 'مناطيد كابادوكيا وكهوفها', 'Sunrise hot-air balloon flights over fairy chimneys, boutique cave-hotel nights, underground cities and pottery workshops in central Anatolia.', 'تحليق بالمنطاد عند الشروق فوق المداخن الصخرية، وليالٍ في فنادق الكهوف، ومدن تحت الأرض، وورش فخّار في وسط الأناضول.', 'Turkey', 'تركيا', 4, 3, 980, 16, 'easy', 'adventure', array['3 nights in a cave hotel', 'Sunrise balloon flight', 'Daily breakfast', 'Göreme open-air museum', 'Airport transfers']::text[], array['3 ليالٍ في فندق كهفي', 'رحلة منطاد عند الشروق', 'إفطار يومي', 'متحف غوريمه المفتوح', 'نقل من وإلى المطار']::text[], array['Flights to Kayseri', 'Lunches and dinners', 'Travel insurance']::text[], array['الطيران إلى قيصري', 'وجبات الغداء والعشاء', 'تأمين السفر']::text[], true, now() - interval '94 days'),
('d0000000-0000-4000-8000-000000000007', '94edd52e-2ec5-4337-8562-1f498814dc43', 'Istanbul & Ephesus Heritage', 'تراث إسطنبول وأفسس', 'Hagia Sophia, the Blue Mosque and the Grand Bazaar, then fly south to walk the marble streets of ancient Ephesus and the travertines of Pamukkale.', 'آيا صوفيا والمسجد الأزرق والبازار الكبير، ثم رحلة جنوباً للمشي في شوارع أفسس الرخامية وعيون باموكالي البيضاء.', 'Turkey', 'تركيا', 6, 5, 1240, 18, 'easy', 'cultural', array['5 nights in 4-star hotels', 'Domestic flight Istanbul–Izmir', 'Daily breakfast', 'Guided old-city tour', 'Ephesus and Pamukkale entries']::text[], array['5 ليالٍ في فنادق 4 نجوم', 'طيران داخلي إسطنبول–إزمير', 'إفطار يومي', 'جولة مع مرشد في المدينة القديمة', 'تذاكر أفسس وباموكالي']::text[], array['International flights', 'Dinners', 'Drinks']::text[], array['الرحلات الدولية', 'وجبات العشاء', 'المشروبات']::text[], false, now() - interval '103 days'),
('d0000000-0000-4000-8000-000000000008', '94edd52e-2ec5-4337-8562-1f498814dc43', 'Imperial Cities of Morocco', 'المدن الإمبراطورية المغربية', 'Rabat, Fez, Meknes and Marrakech: palaces, medinas and tanneries — with a night under the stars in a Sahara desert camp near Merzouga.', 'الرباط وفاس ومكناس ومراكش: قصور وأسواق قديمة ومدابغ — مع ليلة تحت النجوم في مخيم صحراوي قرب مرزوقة.', 'Morocco', 'المغرب', 8, 7, 1350, 16, 'moderate', 'cultural', array['7 nights riads and desert camp', 'Daily breakfast and 4 dinners', '4x4 desert excursion', 'Camel trek at sunset', 'Local guides in each city']::text[], array['7 ليالٍ في رياضات ومخيم صحراوي', 'إفطار يومي و4 وجبات عشاء', 'جولة صحراوية بسيارة دفع رباعي', 'رحلة جمال عند الغروب', 'مرشدون محليون في كل مدينة']::text[], array['International flights', 'Lunches', 'Tips']::text[], array['الرحلات الدولية', 'وجبات الغداء', 'الإكراميات']::text[], false, now() - interval '112 days'),
('d0000000-0000-4000-8000-000000000009', '94edd52e-2ec5-4337-8562-1f498814dc43', 'Cherry Blossom Japan', 'اليابان في موسم أزهار الكرز', 'Time your trip to the sakura front: hanami picnics in Tokyo parks, Kyoto''s Philosopher''s Path in full bloom and castle views in Osaka.', 'رحلة متزامنة مع موسم الساكورا: نزهات الهانامي في حدائق طوكيو، وممشى الفيلسوف في كيوتو وهو مزهر بالكامل، وإطلالات قلعة أوساكا.', 'Japan', 'اليابان', 7, 6, 2150, 14, 'easy', 'nature', array['6 nights in 4-star hotels', 'Bullet train Tokyo–Kyoto', 'Daily breakfast', 'Hanami picnic set', 'Tea ceremony experience']::text[], array['6 ليالٍ في فنادق 4 نجوم', 'قطار سريع طوكيو–كيوتو', 'إفطار يومي', 'سلة نزهة هانامي', 'تجربة حفل الشاي']::text[], array['International flights', 'Most meals', 'Personal expenses']::text[], array['الرحلات الدولية', 'معظم الوجبات', 'المصاريف الشخصية']::text[], false, now() - interval '121 days'),
('d0000000-0000-4000-8000-000000000010', '4260abb8-44d7-4620-8e65-5a1ffe588550', 'Machu Picchu Inca Trail Trek', 'مسار الإنكا إلى ماتشو بيتشو', 'The classic 4-day Inca Trail: cloud forests, high passes and stone stairways ending at the Sun Gate above Machu Picchu at dawn.', 'مسار الإنكا الكلاسيكي لأربعة أيام: غابات ضبابية وممرات مرتفعة ودرجات حجرية تنتهي عند بوابة الشمس فوق ماتشو بيتشو عند الفجر.', 'Peru', 'بيرو', 7, 6, 1890, 12, 'challenging', 'adventure', array['Inca Trail permits', 'Camping equipment and porters', 'All trail meals', '2 hotel nights in Cusco', 'Return train to Cusco']::text[], array['تصاريح مسار الإنكا', 'معدات التخييم والحمّالون', 'جميع وجبات المسار', 'ليلتان في فندق بكوسكو', 'قطار العودة إلى كوسكو']::text[], array['International flights', 'Sleeping bag rental', 'Tips for crew']::text[], array['الرحلات الدولية', 'استئجار كيس النوم', 'إكراميات الطاقم']::text[], true, now() - interval '130 days'),
('d0000000-0000-4000-8000-000000000011', '4260abb8-44d7-4620-8e65-5a1ffe588550', 'Sacred Valley & Cusco Explorer', 'استكشاف الوادي المقدس وكوسكو', 'Acclimatize gently through the Sacred Valley: Pisac markets, Moray terraces, Maras salt mines and a full guided day at Machu Picchu by train.', 'تأقلم تدريجي عبر الوادي المقدس: أسواق بيساك، ومدرّجات موراي، وملاحات ماراس، ويوم كامل مع مرشد في ماتشو بيتشو بالقطار.', 'Peru', 'بيرو', 6, 5, 1420, 14, 'moderate', 'cultural', array['5 nights in hotels', 'Daily breakfast', 'Sacred Valley day tours', 'Machu Picchu train and entry', 'Bilingual guide']::text[], array['5 ليالٍ في فنادق', 'إفطار يومي', 'جولات يومية في الوادي المقدس', 'قطار ماتشو بيتشو وتذكرة الدخول', 'مرشد ثنائي اللغة']::text[], array['International flights', 'Lunches and dinners', 'Huayna Picchu permit']::text[], array['الرحلات الدولية', 'وجبات الغداء والعشاء', 'تصريح هوانا بيتشو']::text[], false, now() - interval '139 days'),
('d0000000-0000-4000-8000-000000000012', '4260abb8-44d7-4620-8e65-5a1ffe588550', 'Amazon Rainforest Lodge Escape', 'ملاذ نزل الأمازون المطيرة', 'Fly from Cusco into Puerto Maldonado for three nights in an eco-lodge: canopy walks, caiman spotting by night and clay licks alive with macaws.', 'طيران من كوسكو إلى بويرتو مالدونادو لثلاث ليالٍ في نزل بيئي: ممرات فوق الأشجار، ورصد الكيمن ليلاً، ومواقع طينية تعجّ بطيور المكاو.', 'Peru', 'بيرو', 5, 4, 1150, 12, 'moderate', 'nature', array['3 nights eco-lodge full board', 'River transfers', 'All guided excursions', 'Rubber boots and rain ponchos', '1 hotel night in Cusco']::text[], array['3 ليالٍ في نزل بيئي بإقامة كاملة', 'نقل نهري', 'جميع الجولات مع مرشد', 'أحذية مطاطية ومعاطف مطر', 'ليلة فندقية في كوسكو']::text[], array['Flights to Puerto Maldonado', 'Drinks', 'Tips']::text[], array['الطيران إلى بويرتو مالدونادو', 'المشروبات', 'الإكراميات']::text[], false, now() - interval '148 days'),
('d0000000-0000-4000-8000-000000000013', '4260abb8-44d7-4620-8e65-5a1ffe588550', 'Vietnam North to South Highlights', 'أبرز معالم فيتنام من الشمال إلى الجنوب', 'Hanoi''s lakeside old town, lantern-lit Hoi An, imperial Hue and the rooftops of Ho Chi Minh City — the full length of Vietnam in ten days.', 'مدينة هانوي القديمة على البحيرة، وهوي آن المضاءة بالفوانيس، وهوي الإمبراطورية، وأسطح مدينة هو تشي منه — فيتنام بطولها في عشرة أيام.', 'Vietnam', 'فيتنام', 10, 9, 1750, 16, 'moderate', 'cultural', array['9 nights in 3-4 star hotels', 'Domestic flights', 'Daily breakfast', 'Hoi An lantern-making workshop', 'All intercity transfers']::text[], array['9 ليالٍ في فنادق 3-4 نجوم', 'طيران داخلي', 'إفطار يومي', 'ورشة صنع الفوانيس في هوي آن', 'جميع التنقلات بين المدن']::text[], array['International flights', 'Visa fees', 'Most lunches and dinners']::text[], array['الرحلات الدولية', 'رسوم التأشيرة', 'معظم وجبات الغداء والعشاء']::text[], false, now() - interval '157 days'),
('d0000000-0000-4000-8000-000000000014', '4260abb8-44d7-4620-8e65-5a1ffe588550', 'Mekong Delta River Life', 'حياة النهر في دلتا الميكونغ', 'Float through the Mekong''s floating markets, coconut workshops and stilt villages by sampan, sleeping at a riverside homestay among the orchards.', 'تجوّل في أسواق الميكونغ العائمة وورش جوز الهند وقرى الأكواخ الخشبية بقارب السامبان، مع مبيت في ضيافة عائلية على ضفة النهر بين البساتين.', 'Vietnam', 'فيتنام', 4, 3, 680, 12, 'easy', 'nature', array['1 night homestay + 2 hotel nights', 'Sampan and boat rides', 'All breakfasts and 2 lunches', 'Cycling through orchards', 'Ho Chi Minh City transfers']::text[], array['ليلة ضيافة عائلية + ليلتان فندقيتان', 'جولات بقوارب السامبان', 'جميع وجبات الإفطار ووجبتا غداء', 'ركوب الدراجات بين البساتين', 'نقل من وإلى هو تشي منه']::text[], array['Flights', 'Dinners', 'Drinks']::text[], array['الطيران', 'وجبات العشاء', 'المشروبات']::text[], false, now() - interval '166 days')
on conflict (id) do nothing;

update public.packages set status = 'published', cancellation_policy = coalesce(cancellation_policy, 'Free cancellation up to 30 days before departure; 50% refund up to 14 days before.'), available_from = coalesce(available_from, date '2026-07-01'), available_to = coalesce(available_to, date '2027-06-30') where id::text like 'd0000000-%';

insert into public.package_media (package_id, file_path, file_name, media_type, is_primary, display_order)
select v.pid, v.path, v.fname, 'image', v.prim, v.ord from (values
('d0000000-0000-4000-8000-000000000001'::uuid, 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=1200', 'italian-renaissance-journey-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000001'::uuid, 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200', 'italian-renaissance-journey-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000001'::uuid, 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200', 'italian-renaissance-journey-3.jpg', false, 2),
('d0000000-0000-4000-8000-000000000002'::uuid, 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200', 'tuscany-wine-and-countryside-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000002'::uuid, 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=1200', 'tuscany-wine-and-countryside-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000003'::uuid, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200', 'turquoise-coast-sailing-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000003'::uuid, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200', 'turquoise-coast-sailing-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000004'::uuid, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'halong-bay-luxury-cruise-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000004'::uuid, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200', 'halong-bay-luxury-cruise-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000005'::uuid, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200', 'japan-golden-route-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000005'::uuid, 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=1200', 'japan-golden-route-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000006'::uuid, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200', 'cappadocia-balloons-and-caves-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000006'::uuid, 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200', 'cappadocia-balloons-and-caves-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000007'::uuid, 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200', 'istanbul-and-ephesus-heritage-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000007'::uuid, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200', 'istanbul-and-ephesus-heritage-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000008'::uuid, 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200', 'imperial-cities-of-morocco-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000008'::uuid, 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200', 'imperial-cities-of-morocco-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000009'::uuid, 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=1200', 'cherry-blossom-japan-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000009'::uuid, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200', 'cherry-blossom-japan-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000010'::uuid, 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=1200', 'machu-picchu-inca-trail-trek-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000010'::uuid, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200', 'machu-picchu-inca-trail-trek-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000011'::uuid, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200', 'sacred-valley-and-cusco-explorer-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000011'::uuid, 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=1200', 'sacred-valley-and-cusco-explorer-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000012'::uuid, 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200', 'amazon-rainforest-lodge-escape-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000012'::uuid, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200', 'amazon-rainforest-lodge-escape-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000013'::uuid, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'vietnam-north-to-south-highlights-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000013'::uuid, 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200', 'vietnam-north-to-south-highlights-2.jpg', false, 1),
('d0000000-0000-4000-8000-000000000014'::uuid, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200', 'mekong-delta-river-life-1.jpg', true, 0),
('d0000000-0000-4000-8000-000000000014'::uuid, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200', 'mekong-delta-river-life-2.jpg', false, 1)
) v(pid, path, fname, prim, ord)
where not exists (select 1 from public.package_media m where m.package_id = v.pid and m.display_order = v.ord);

insert into public.package_routes (package_id, destination_order, name, name_ar, latitude, longitude, destination_type, days_spent)
select v.pid, v.ord, v.n, v.nar, v.lat, v.lng, v.t, v.ds from (values
('d0000000-0000-4000-8000-000000000001'::uuid, 0, 'Rome', 'روما', 41.9028, 12.4964, 'origin', 2),
('d0000000-0000-4000-8000-000000000001'::uuid, 1, 'Florence', 'فلورنسا', 43.7696, 11.2558, 'stop', 2),
('d0000000-0000-4000-8000-000000000001'::uuid, 2, 'Venice', 'البندقية', 45.4408, 12.3155, 'destination', 2),
('d0000000-0000-4000-8000-000000000002'::uuid, 0, 'Florence', 'فلورنسا', 43.7696, 11.2558, 'origin', 2),
('d0000000-0000-4000-8000-000000000002'::uuid, 1, 'Siena', 'سيينا', 43.3188, 11.3308, 'stop', 2),
('d0000000-0000-4000-8000-000000000002'::uuid, 2, 'San Gimignano', 'سان جيمينيانو', 43.4677, 11.0431, 'destination', 2),
('d0000000-0000-4000-8000-000000000003'::uuid, 0, 'Fethiye', 'فتحية', 36.6604, 29.1263, 'origin', 2),
('d0000000-0000-4000-8000-000000000003'::uuid, 1, 'Kaş', 'كاش', 36.202, 29.6414, 'stop', 2),
('d0000000-0000-4000-8000-000000000003'::uuid, 2, 'Kekova', 'كيكوفا', 36.19, 29.871, 'destination', 2),
('d0000000-0000-4000-8000-000000000004'::uuid, 0, 'Hanoi', 'هانوي', 21.0285, 105.8542, 'origin', 2),
('d0000000-0000-4000-8000-000000000004'::uuid, 1, 'Halong Bay', 'خليج ها لونغ', 20.9101, 107.1839, 'destination', 2),
('d0000000-0000-4000-8000-000000000005'::uuid, 0, 'Tokyo', 'طوكيو', 35.6762, 139.6503, 'origin', 2),
('d0000000-0000-4000-8000-000000000005'::uuid, 1, 'Hakone', 'هاكوني', 35.2324, 139.1069, 'stop', 2),
('d0000000-0000-4000-8000-000000000005'::uuid, 2, 'Kyoto', 'كيوتو', 35.0116, 135.7681, 'stop', 2),
('d0000000-0000-4000-8000-000000000005'::uuid, 3, 'Osaka', 'أوساكا', 34.6937, 135.5023, 'destination', 2),
('d0000000-0000-4000-8000-000000000006'::uuid, 0, 'Göreme', 'غوريمه', 38.6431, 34.8283, 'origin', 1),
('d0000000-0000-4000-8000-000000000006'::uuid, 1, 'Uçhisar', 'أوتشيسار', 38.627, 34.805, 'stop', 1),
('d0000000-0000-4000-8000-000000000006'::uuid, 2, 'Kaymaklı', 'كايماكلي', 38.459, 34.751, 'destination', 1),
('d0000000-0000-4000-8000-000000000007'::uuid, 0, 'Istanbul', 'إسطنبول', 41.0082, 28.9784, 'origin', 2),
('d0000000-0000-4000-8000-000000000007'::uuid, 1, 'Ephesus', 'أفسس', 37.9411, 27.3419, 'stop', 2),
('d0000000-0000-4000-8000-000000000007'::uuid, 2, 'Pamukkale', 'باموكالي', 37.9204, 29.121, 'destination', 2),
('d0000000-0000-4000-8000-000000000008'::uuid, 0, 'Rabat', 'الرباط', 34.0209, -6.8416, 'origin', 2),
('d0000000-0000-4000-8000-000000000008'::uuid, 1, 'Fez', 'فاس', 34.0181, -5.0078, 'stop', 2),
('d0000000-0000-4000-8000-000000000008'::uuid, 2, 'Merzouga', 'مرزوقة', 31.0994, -4.0126, 'stop', 2),
('d0000000-0000-4000-8000-000000000008'::uuid, 3, 'Marrakech', 'مراكش', 31.6295, -7.9811, 'destination', 2),
('d0000000-0000-4000-8000-000000000009'::uuid, 0, 'Tokyo', 'طوكيو', 35.6762, 139.6503, 'origin', 2),
('d0000000-0000-4000-8000-000000000009'::uuid, 1, 'Kyoto', 'كيوتو', 35.0116, 135.7681, 'stop', 2),
('d0000000-0000-4000-8000-000000000009'::uuid, 2, 'Osaka', 'أوساكا', 34.6937, 135.5023, 'destination', 2),
('d0000000-0000-4000-8000-000000000010'::uuid, 0, 'Cusco', 'كوسكو', -13.532, -71.9675, 'origin', 2),
('d0000000-0000-4000-8000-000000000010'::uuid, 1, 'Ollantaytambo', 'أويانتايتامبو', -13.2588, -72.2646, 'stop', 2),
('d0000000-0000-4000-8000-000000000010'::uuid, 2, 'Machu Picchu', 'ماتشو بيتشو', -13.1631, -72.545, 'destination', 2),
('d0000000-0000-4000-8000-000000000011'::uuid, 0, 'Cusco', 'كوسكو', -13.532, -71.9675, 'origin', 2),
('d0000000-0000-4000-8000-000000000011'::uuid, 1, 'Pisac', 'بيساك', -13.4225, -71.8469, 'stop', 2),
('d0000000-0000-4000-8000-000000000011'::uuid, 2, 'Machu Picchu', 'ماتشو بيتشو', -13.1631, -72.545, 'destination', 2),
('d0000000-0000-4000-8000-000000000012'::uuid, 0, 'Cusco', 'كوسكو', -13.532, -71.9675, 'origin', 2),
('d0000000-0000-4000-8000-000000000012'::uuid, 1, 'Puerto Maldonado', 'بويرتو مالدونادو', -12.5933, -69.1891, 'destination', 2),
('d0000000-0000-4000-8000-000000000013'::uuid, 0, 'Hanoi', 'هانوي', 21.0285, 105.8542, 'origin', 2),
('d0000000-0000-4000-8000-000000000013'::uuid, 1, 'Hue', 'هوي', 16.4637, 107.5909, 'stop', 2),
('d0000000-0000-4000-8000-000000000013'::uuid, 2, 'Hoi An', 'هوي آن', 15.8801, 108.338, 'stop', 2),
('d0000000-0000-4000-8000-000000000013'::uuid, 3, 'Ho Chi Minh City', 'هو تشي منه', 10.8231, 106.6297, 'destination', 2),
('d0000000-0000-4000-8000-000000000014'::uuid, 0, 'Ho Chi Minh City', 'هو تشي منه', 10.8231, 106.6297, 'origin', 1),
('d0000000-0000-4000-8000-000000000014'::uuid, 1, 'Cai Be', 'كاي بي', 10.348, 105.922, 'stop', 1),
('d0000000-0000-4000-8000-000000000014'::uuid, 2, 'Can Tho', 'كان ثو', 10.0452, 105.7469, 'destination', 1),
('11111111-1111-4111-8111-111111111111'::uuid, 0, 'Riyadh', 'الرياض', 24.7136, 46.6753, 'origin', 1),
('11111111-1111-4111-8111-111111111111'::uuid, 1, 'AlUla', 'العلا', 26.6084, 37.9218, 'stop', 1),
('11111111-1111-4111-8111-111111111111'::uuid, 2, 'Edge of the World', 'حافة العالم', 25.0, 45.9, 'destination', 1),
('22222222-2222-4222-8222-222222222222'::uuid, 0, 'Denver', 'دنفر', 39.7392, -104.9903, 'origin', 2),
('22222222-2222-4222-8222-222222222222'::uuid, 1, 'Aspen', 'أسبن', 39.1911, -106.8175, 'stop', 2),
('22222222-2222-4222-8222-222222222222'::uuid, 2, 'Rocky Mountain NP', 'منتزه جبال روكي', 40.3428, -105.6836, 'destination', 2),
('33333333-3333-4333-8333-333333333333'::uuid, 0, 'Lisbon', 'لشبونة', 38.7223, -9.1393, 'origin', 3),
('33333333-3333-4333-8333-333333333333'::uuid, 1, 'Seville', 'إشبيلية', 37.3891, -5.9845, 'stop', 3),
('33333333-3333-4333-8333-333333333333'::uuid, 2, 'Barcelona', 'برشلونة', 41.3874, 2.1686, 'destination', 3),
('44444444-4444-4444-8444-444444444444'::uuid, 0, 'Amman', 'عمّان', 31.9539, 35.9106, 'origin', 2),
('44444444-4444-4444-8444-444444444444'::uuid, 1, 'Petra', 'البتراء', 30.3285, 35.4444, 'stop', 2),
('44444444-4444-4444-8444-444444444444'::uuid, 2, 'Wadi Rum', 'وادي رم', 29.5765, 35.4207, 'destination', 2),
('55555555-5555-4555-8555-555555555555'::uuid, 0, 'Jackson', 'جاكسون', 43.4799, -110.7624, 'origin', 2),
('55555555-5555-4555-8555-555555555555'::uuid, 1, 'Yellowstone', 'يلوستون', 44.428, -110.5885, 'destination', 2),
('66666666-6666-4666-8666-666666666666'::uuid, 0, 'Athens', 'أثينا', 37.9838, 23.7275, 'origin', 2),
('66666666-6666-4666-8666-666666666666'::uuid, 1, 'Mykonos', 'ميكونوس', 37.4467, 25.3289, 'stop', 2),
('66666666-6666-4666-8666-666666666666'::uuid, 2, 'Santorini', 'سانتوريني', 36.3932, 25.4615, 'destination', 2),
('77777777-7777-4777-8777-777777777777'::uuid, 0, 'Dubai', 'دبي', 25.2048, 55.2708, 'origin', 2),
('77777777-7777-4777-8777-777777777777'::uuid, 1, 'Abu Dhabi', 'أبوظبي', 24.4539, 54.3773, 'destination', 2),
('88888888-8888-4888-8888-888888888888'::uuid, 0, 'Sedona', 'سيدونا', 34.8697, -111.761, 'origin', 1),
('88888888-8888-4888-8888-888888888888'::uuid, 1, 'Grand Canyon', 'جراند كانيون', 36.1069, -112.1129, 'destination', 1),
('99999999-9999-4999-8999-999999999999'::uuid, 0, 'Naples', 'نابولي', 40.8518, 14.2681, 'origin', 1),
('99999999-9999-4999-8999-999999999999'::uuid, 1, 'Positano', 'بوسيتانو', 40.6281, 14.485, 'stop', 1),
('99999999-9999-4999-8999-999999999999'::uuid, 2, 'Amalfi', 'أمالفي', 40.634, 14.6027, 'destination', 1),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 0, 'Cairo', 'القاهرة', 30.0444, 31.2357, 'origin', 2),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 1, 'Luxor', 'الأقصر', 25.6872, 32.6396, 'stop', 2),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 2, 'Aswan', 'أسوان', 24.0889, 32.8998, 'destination', 2),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 0, 'Anchorage', 'أنكوريج', 61.2181, -149.9003, 'origin', 3),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid, 1, 'Denali', 'دينالي', 63.1148, -151.1926, 'destination', 3),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 0, 'Marrakech', 'مراكش', 31.6295, -7.9811, 'origin', 2),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 1, 'Fez', 'فاس', 34.0181, -5.0078, 'stop', 2),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid, 2, 'Merzouga', 'مرزوقة', 31.0994, -4.0126, 'destination', 2)
) v(pid, ord, n, nar, lat, lng, t, ds)
where not exists (select 1 from public.package_routes r where r.package_id = v.pid and r.destination_order = v.ord);

-- Bilingual day-by-day itineraries templated from each package's route stops:
-- day 1 arrival at the first stop, final day departure from the last stop,
-- middle days distributed across the stops in order.
insert into public.itineraries (package_id, day_number, title, title_ar, description, description_ar, activities, activities_ar, meals_included, accommodation, transportation)
select
  p.id,
  d.day,
  case when d.day = 1 then 'Arrival in ' || s.name
       when d.day = p.duration_days then 'Departure from ' || s.name
       else 'Exploring ' || s.name end,
  case when d.day = 1 then 'الوصول إلى ' || coalesce(s.name_ar, s.name)
       when d.day = p.duration_days then 'المغادرة من ' || coalesce(s.name_ar, s.name)
       else 'استكشاف ' || coalesce(s.name_ar, s.name) end,
  case when d.day = 1 then 'Meet your guide at the airport, transfer to the hotel and enjoy a welcome dinner with a short briefing on the days ahead in ' || s.name || '.'
       when d.day = p.duration_days then 'Free morning for last souvenirs before your transfer to the airport in ' || s.name || '.'
       else 'A full guided day around ' || s.name || ': the landmark sights in the morning, local food at midday and free time to wander in the afternoon.' end,
  case when d.day = 1 then 'استقبال في المطار مع مرشدك، والانتقال إلى الفندق، وعشاء ترحيبي مع شرح موجز لبرنامج الأيام القادمة في ' || coalesce(s.name_ar, s.name) || '.'
       when d.day = p.duration_days then 'صباح حر لشراء آخر التذكارات قبل الانتقال إلى المطار في ' || coalesce(s.name_ar, s.name) || '.'
       else 'يوم كامل مع المرشد في ' || coalesce(s.name_ar, s.name) || ': أبرز المعالم صباحاً، ومأكولات محلية ظهراً، ووقت حر للتجول عصراً.' end,
  case when d.day = 1 then array['Airport welcome and transfer', 'Hotel check-in', 'Welcome dinner']
       when d.day = p.duration_days then array['Free morning', 'Souvenir shopping', 'Airport transfer']
       else array['Guided tour of ' || s.name, 'Local lunch stop', 'Free exploration time'] end,
  case when d.day = 1 then array['استقبال في المطار والانتقال', 'تسجيل الدخول في الفندق', 'عشاء ترحيبي']
       when d.day = p.duration_days then array['صباح حر', 'تسوق التذكارات', 'الانتقال إلى المطار']
       else array['جولة إرشادية في ' || coalesce(s.name_ar, s.name), 'محطة غداء محلية', 'وقت حر للاستكشاف'] end,
  case when d.day = 1 then array['Dinner']
       when d.day = p.duration_days then array['Breakfast']
       else array['Breakfast', 'Lunch'] end,
  case when d.day = p.duration_days then null else 'Hotel in ' || s.name end,
  case when d.day = 1 or d.day = p.duration_days then 'Private transfer' else 'Air-conditioned coach' end
from public.packages p
cross join lateral generate_series(1, p.duration_days) as d(day)
join lateral (
  select r.name, r.name_ar
  from public.package_routes r
  where r.package_id = p.id
  order by r.destination_order
  offset case
    when d.day = 1 then 0
    when d.day = p.duration_days then (select count(*) - 1 from public.package_routes r2 where r2.package_id = p.id)
    else least(
      ((d.day - 1) * (select count(*) from public.package_routes r2 where r2.package_id = p.id)) / greatest(p.duration_days - 1, 1),
      (select count(*) - 1 from public.package_routes r2 where r2.package_id = p.id))
  end
  limit 1
) s on true
where p.status = 'published'
  and not exists (select 1 from public.itineraries i where i.package_id = p.id);

-- Departure calendar for the new packages: 4 completed past departures for
-- booking history plus 8 future scheduled ones every 2 weeks; the 2nd and
-- 5th future departures carry a 12% early-bird price override.
insert into public.package_departures (package_id, departure_date, return_date, total_seats, price_override, status, created_at)
select p.id,
       dep.dt,
       dep.dt + (p.duration_days - 1),
       p.max_participants,
       case when dep.k in (5, 8) then round(p.base_price * 0.88, 0) end,
       case when dep.dt < current_date then 'completed' else 'scheduled' end,
       least(dep.dt - 60, current_date)::timestamptz
from public.packages p
cross join lateral (
  select gs.k,
         case when gs.k <= 4 then date '2026-07-17' - (40 + (gs.k - 1) * 35)
              else date '2026-07-17' + ((gs.k - 5) * 14) end as dt
  from generate_series(1, 12) gs(k)
) dep
where p.id::text like 'd0000000-%'
  and not exists (select 1 from public.package_departures d where d.package_id = p.id);
