-- The Petra package's primary image URL 404s on Unsplash (blocked by ORB in
-- the browser). Point it at a verified working image from the catalog pool.
update public.package_media
set file_path = 'https://images.unsplash.com/photo-1548786811-dd6e453ccca7?w=1200'
where file_path = 'https://images.unsplash.com/photo-1579606032821-4e6161c81571?w=1200';
