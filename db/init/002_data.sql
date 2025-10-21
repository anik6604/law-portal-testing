--
-- PostgreSQL database dump
--

\restrict 4ThxFT1p3nenYGR8bzIf0woT3dpsgihWNBiw4oQM9EcpN1c3Qts87sgKkiBC16g

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg12+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;
--
--
--

97	Curriculum Vitae	ed.koellner@gmail.com	(404) 428-2072	\N	2025-10-12 01:08:41.869036+00
51	Gopika Shah	gshah@smu.edu	\N	\N	2025-10-12 01:08:35.400245+00
```sql
-- Fresh PostgreSQL database dump created by automated task
-- Dumped from database version 16.10 (Debian 16.10-1.pgdg12+1)
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- (full dump content stored in resume_full_dump.sql in repo root)

-- To regenerate locally: docker-compose exec -T db pg_dump -U tamu -d law_portal --format=plain --no-owner --no-privileges > resume_full_dump.sql

-- NOTE: The complete dump file is present at project root as resume_full_dump.sql

```
114	Hiring Committee	mjp@martinjpeters.com	(770) 406-6024	\N	2025-10-12 01:08:43.957313+00
115	Frank A. Piocos	fpiocos@yahoo.com	(406) 690-1199	\N	2025-10-12 01:08:44.040255+00
116	Joseph A. Race	josephandrewrace@yahoo.com	(203) 535-6559	\N	2025-10-12 01:08:44.146108+00
42	Professional Experience	lauren.j.rainey@gmail.com	(609) 947-7994	\N	2025-10-12 01:05:54.970307+00
118	Kimberly F. Rich	kimberlyfrich@icloud.com	(214) 632-2595	\N	2025-10-12 01:08:44.41508+00
119	Gary A. Rubin	garyarubin@gmail.com	(202) 286-8160	\N	2025-10-12 01:08:44.522238+00
120	Joseph J. Rzeppa	jrzeppa@sbcglobal.net	(586) 915-4045	\N	2025-10-12 01:08:44.613887+00
121	Elizabeth Schneider, Esquire	attyschneider@aol.com	(570) 586-5598	\N	2025-10-12 01:08:44.722803+00
122	Mark D. Schultz	markdschultz@hotmail.com	(703) 371-4701	\N	2025-10-12 01:08:44.836983+00
123	Micah E. Skidmore	micah.skidmore@haynesboone.com	(214) 206-7175	\N	2025-10-12 01:08:44.951172+00
124	Eric P. Smith Jd	ericpsmith14@gmail.com	(814) 876-0318	\N	2025-10-12 01:08:45.051856+00
125	Alida B. Soileau	alida.soileau@gmail.com	(318) 423-6052	\N	2025-10-12 01:08:45.185684+00
126	Courtney St Julian	courtney_st.julian@ccl.hctx.net	(346) 286-1389	\N	2025-10-12 01:08:45.291368+00
127	Jesse D. Steele	jesse.d.steele@gmail.com	(231) 563-1725	\N	2025-10-12 01:08:45.39259+00
128	Jennifer Taveras	wjtaveras@att.net	(832) 454-6644	\N	2025-10-12 01:08:45.529224+00
129	Dear Hiring Committee,	ashley.rouse88@gmail.com	(773) 304-6814	\N	2025-10-12 01:08:45.634234+00
130	Dear Ms. Merrywell-	bradtrevino@gmail.com	(817) 212-4040	\N	2025-10-12 01:08:45.74717+00
131	Luis Alejandro Urrea	luis.ale.urrea@gmail.com	(281) 750-9917	\N	2025-10-12 01:08:45.835605+00
132	Marnitia T. Walker	marnitiawalker@gmail.com	+1 (240) 216-6537	\N	2025-10-12 01:08:45.929689+00
133	Brinton T. Warren	brinton_w@yahoo.com	(703) 346-3655	\N	2025-10-12 01:08:46.037054+00
134	Samuel C. Webb	swebb@tamu.edu	(972) 310-9541	\N	2025-10-12 01:08:46.144917+00
135	Keifer Blake Wells	keiferwells@me.com	(248) 444-9774	\N	2025-10-12 01:08:46.260217+00
136	Cristina M. Zambrana	zgitana@hotmail.com	(520) 405-5614	\N	2025-10-12 01:08:46.416361+00
\.

--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resumes (resume_id, applicant_id, resume_file, cover_letter_file, extracted_text, uploaded_at, embedding) FROM stdin;
8	9	alaiat_ahmed_5067884 (1).pdf	\N	Ahmed Alaiat\n(505) 210-2025 ahmed@albousaifilaw.com Cleveland, OH 44133linkedin.com/in/ahmed-alaiat-albousaifi\nEDUCATION\nDoctorate Degree: Doctor of Juridical Science (SJD) Cleveland, OH\nCase Western Reserve University School of Law Jan 2024
... (truncated in this view for brevity) 
\.

-- Ensure sequences are set to the max existing id
SELECT pg_catalog.setval('public.applicants_applicant_id_seq', (SELECT MAX(applicant_id) FROM public.applicants));
SELECT pg_catalog.setval('public.resumes_resume_id_seq', (SELECT MAX(resume_id) FROM public.resumes));

-- End of dump
