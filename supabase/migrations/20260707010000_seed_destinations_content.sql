-- Seed: destinations catalog + email-template content pages.
-- Content ported verbatim from the frontend mock data being retired:
--   src/features/packages/pages/Destinations.tsx (DESTINATION_DATA)
--   src/features/home/components/DestinationsSection.tsx (destinationCards)
--   src/i18n/locales/{en,ar}.json (destinations.items.*)

insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, description, description_ar, highlights, highlights_ar, region_keys, image_url, display_order)
values ('vietnam', 'country', 'Vietnam', 'فيتنام', 'Southeast Asia', 'جنوب شرق آسيا', 'From bustling cities to serene countryside, Vietnam offers incredible diversity.', 'من المدن النابضة بالحياة إلى الأرياف الهادئة، تقدّم فيتنام تنوعاً مذهلاً.', array['Halong Bay', 'Ho Chi Minh City', 'Hoi An', 'Hanoi']::text[], array['خليج ها لونغ', 'مدينة هو تشي منه', 'هوي آن', 'هانوي']::text[], array['asia']::text[], 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop', 1)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, description, description_ar, highlights, highlights_ar, region_keys, image_url, display_order)
values ('turkey', 'country', 'Turkey', 'تركيا', 'Europe/Asia', 'أوروبا وآسيا', 'Where East meets West - ancient history and modern culture collide.', 'حيث يلتقي الشرق بالغرب — تاريخ عريق وثقافة حديثة في مكان واحد.', array['Cappadocia', 'Istanbul', 'Pamukkale', 'Ephesus']::text[], array['كابادوكيا', 'إسطنبول', 'باموكالي', 'أفسس']::text[], array['europe', 'asia']::text[], 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&h=400&fit=crop', 2)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, description, description_ar, highlights, highlights_ar, region_keys, image_url, display_order)
values ('morocco', 'country', 'Morocco', 'المغرب', 'North Africa', 'شمال أفريقيا', 'Desert adventures, imperial cities, and exotic markets await.', 'مغامرات صحراوية ومدن عريقة وأسواق ساحرة بانتظارك.', array['Marrakech', 'Sahara Desert', 'Fez', 'Casablanca']::text[], array['مراكش', 'الصحراء الكبرى', 'فاس', 'الدار البيضاء']::text[], array['africa']::text[], 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&h=400&fit=crop', 3)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, description, description_ar, highlights, highlights_ar, region_keys, image_url, display_order)
values ('japan', 'country', 'Japan', 'اليابان', 'East Asia', 'شرق آسيا', 'Ancient traditions blend seamlessly with cutting-edge technology.', 'تقاليد عريقة تمتزج بسلاسة مع أحدث ما وصلت إليه التقنية.', array['Tokyo', 'Kyoto', 'Mount Fuji', 'Osaka']::text[], array['طوكيو', 'كيوتو', 'جبل فوجي', 'أوساكا']::text[], array['asia']::text[], 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop', 4)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, description, description_ar, highlights, highlights_ar, region_keys, image_url, display_order)
values ('peru', 'country', 'Peru', 'بيرو', 'South America', 'أمريكا الجنوبية', 'Home to ancient civilizations and breathtaking landscapes.', 'موطن الحضارات القديمة والمناظر الطبيعية الخلابة.', array['Machu Picchu', 'Cusco', 'Sacred Valley', 'Lima']::text[], array['ماتشو بيتشو', 'كوسكو', 'الوادي المقدس', 'ليما']::text[], array['americas']::text[], 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=600&h=400&fit=crop', 5)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, description, description_ar, highlights, highlights_ar, region_keys, image_url, display_order)
values ('italy', 'country', 'Italy', 'إيطاليا', 'Southern Europe', 'جنوب أوروبا', 'Art, history, cuisine, and romance in the heart of Europe.', 'فن وتاريخ ومأكولات ورومانسية في قلب أوروبا.', array['Rome', 'Florence', 'Venice', 'Tuscany']::text[], array['روما', 'فلورنسا', 'البندقية', 'توسكانا']::text[], array['europe']::text[], 'https://images.unsplash.com/photo-1469041797191-50ace28483c3?w=600&h=400&fit=crop', 6)
on conflict (slug) do nothing;

insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, region_keys, image_url, color_class, display_order)
values ('region-europe', 'region', 'Europe', 'أوروبا', 'Cultural Journeys', 'رحلات ثقافية', array['europe']::text[], 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop', 'bg-green-50 dark:bg-green-900/30', 1)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, region_keys, image_url, color_class, display_order)
values ('region-asia', 'region', 'Asia', 'آسيا', 'Adventure Tours', 'رحلات المغامرة', array['asia']::text[], 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 'bg-orange-50 dark:bg-orange-900/30', 2)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, region_keys, image_url, color_class, display_order)
values ('region-americas', 'region', 'Americas', 'الأمريكتين', 'Wild Expeditions', 'رحلات استكشافية', array['americas']::text[], 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=400&h=300&fit=crop', 'bg-red-50 dark:bg-red-900/30', 3)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, region_keys, image_url, color_class, display_order)
values ('region-africa', 'region', 'Africa', 'أفريقيا', 'Safari Adventures', 'رحلات السفاري', array['africa']::text[], 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop', 'bg-yellow-50 dark:bg-yellow-900/30', 4)
on conflict (slug) do nothing;
insert into public.destinations (slug, kind, name, name_ar, region_label, region_label_ar, region_keys, image_url, color_class, display_order)
values ('region-oceania', 'region', 'Oceania', 'أوقيانوسيا', 'Island Escapes', 'رحلات الجزر', array['oceania']::text[], 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 'bg-blue-50 dark:bg-blue-900/30', 5)
on conflict (slug) do nothing;

-- Email templates previously hardcoded as static cards in AdminSettings.tsx
insert into public.content_pages (title, slug, content_type, content, status)
values ('Booking Confirmation', 'booking-confirmation-email', 'email_template', 'Sent to travelers when a booking is confirmed. Includes package summary, departure date, participants and total price.', 'published')
on conflict (slug) do nothing;
insert into public.content_pages (title, slug, content_type, content, status)
values ('Agency Approval', 'agency-approval-email', 'email_template', 'Sent to agencies when an admin approves their account and they can start publishing packages.', 'published')
on conflict (slug) do nothing;
insert into public.content_pages (title, slug, content_type, content, status)
values ('Payout Notification', 'payout-notification-email', 'email_template', 'Sent to agencies when a monthly payout is processed, with period, amount and payment reference.', 'published')
on conflict (slug) do nothing;
insert into public.content_pages (title, slug, content_type, content, status)
values ('Welcome Email', 'welcome-email', 'email_template', 'Sent to new travelers after signup with a short platform introduction and featured tours.', 'published')
on conflict (slug) do nothing;
