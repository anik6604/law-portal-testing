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
-- Name: applicants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.applicants (
    applicant_id integer NOT NULL,
    name character varying(200) NOT NULL,
    email character varying(200) NOT NULL,
    phone character varying(50),
    note text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: applicants_applicant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.applicants_applicant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: applicants_applicant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.applicants_applicant_id_seq OWNED BY public.applicants.applicant_id;


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resumes (
    resume_id integer NOT NULL,
    applicant_id integer NOT NULL,
    resume_file character varying(500),
    cover_letter_file character varying(500),
    extracted_text text,
    uploaded_at timestamp with time zone DEFAULT now(),
    embedding public.vector(384)
);


--
-- Name: resumes_resume_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resumes_resume_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resumes_resume_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resumes_resume_id_seq OWNED BY public.resumes.resume_id;


--
-- Name: applicants applicant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applicants ALTER COLUMN applicant_id SET DEFAULT nextval('public.applicants_applicant_id_seq'::regclass);


--
-- Name: resumes resume_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resumes ALTER COLUMN resume_id SET DEFAULT nextval('public.resumes_resume_id_seq'::regclass);


--
-- Data for Name: applicants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.applicants (applicant_id, name, email, phone, note, created_at) FROM stdin;
9	alaiat ahmed	aa@a.com	\N	referred by dean	2025-10-10 22:35:31.143927+00
10	allin amy 	asdads@asd.com	\N	\N	2025-10-10 22:35:43.511121+00
11	Anna Vino	asdads@asd.cas	\N	\N	2025-10-10 22:35:57.143146+00
12	Nana Asare	asdasdana@asda.comas	\N	\N	2025-10-10 22:36:11.490699+00
13	Conrado Asenjo	asdasd@asfafasfasfwa.com	\N	\N	2025-10-10 22:36:27.773323+00
14	Rachel b	aosfjafl@afasf.com	\N	\N	2025-10-10 22:36:42.885271+00
15	Paul beard	asdasdD@asfasfaf.c	\N	\N	2025-10-10 22:36:55.567209+00
16	Jason Bess	asdasdadf@asdasd.aasdasdadadad	\N	\N	2025-10-10 22:37:15.706775+00
17	afua bigiriwa	asdasdadf@asdasd.aasdasdadada	\N	\N	2025-10-10 22:37:29.099515+00
18	Bryan Byrd	asdasdadf@asdasd.aasdasdadad	\N	\N	2025-10-10 22:37:40.285579+00
19	David Brody	asdasdadf@asdasd.aasdasdad	\N	reffered by king von	2025-10-10 22:37:56.632812+00
97	Curriculum Vitae	ed.koellner@gmail.com	(404) 428-2072	\N	2025-10-12 01:08:41.869036+00
98	James Landry	james@landrypllc.com	(678) 761-1056	\N	2025-10-12 01:08:41.970641+00
99	Leslie Lenckus	leslie@lenckuslawfirm.com	(210) 315-2886	\N	2025-10-12 01:08:42.078648+00
100	Emma Lentsch	emlentsch@gmail.com	(402) 871-2434	\N	2025-10-12 01:08:42.17168+00
101	Fabio Leonardi	leonardifabio@gmail.com	(917) 216-0390	\N	2025-10-12 01:08:42.280173+00
49	Anna Vino	annavinolaw@gmail.com	(508) 740-4273	\N	2025-10-12 01:08:34.935267+00
20	Berkstresser Academic	gordon.berkstresser@yahoo.com	(678) 231-3709	\N	2025-10-12 01:01:53.639253+00
51	Gopika Shah	gshah@smu.edu	\N	\N	2025-10-12 01:08:35.400245+00
52	Abner A. Mendoza, Phd	abmendoza@tamu.edu	(979) 492-2626	\N	2025-10-12 01:08:35.521345+00
24	Varnell Resume	stephenkvarnell@gmail.com	(817) 565-9208	\N	2025-10-12 01:05:53.461827+00
54	Ahmed Alaiat	ahmed@albousaifilaw.com	(505) 210-2025	\N	2025-10-12 01:08:35.770564+00
55	Texas A&m University	amyallin1015@gmail.com	(214) 460-4375	\N	2025-10-12 01:08:35.922884+00
56	Nana K. Asare	nanasare12@gmail.com	(832) 566-4026	\N	2025-10-12 01:08:36.075083+00
26	Conrado Asenjo-molina, Esq.	conrado.asenjo@gmail.com	(787) 565-7819	\N	2025-10-12 01:05:53.625024+00
58	Rachel R. Brockl	rachelrbrockl@gmail.com	(510) 541-1698	\N	2025-10-12 01:08:36.296768+00
59	Paul Beard Ii	pauljamesbeard2@gmail.com	(818) 216-3988	\N	2025-10-12 01:08:36.422221+00
60	Dear Hiring Committee,	jason.bess@gmail.com	(570) 417-9688	\N	2025-10-12 01:08:36.541527+00
61	Impactful Changes.	afua.bigirwa@gmail.com	(607) 435-4699	\N	2025-10-12 01:08:36.650902+00
62	Academic Programs.	brybir@gmail.com	(636) 579-3103	\N	2025-10-12 01:08:36.756244+00
63	David Brody	davidsbrody@gmail.com	(534) 835-0315	\N	2025-10-12 01:08:36.881662+00
64	Joseph A. Burke	jaburke0@gmail.com	(512) 810-1389	\N	2025-10-12 01:08:37.030521+00
65	Michael Caves	caves.esq@gmail.com	(916) 207-6318	\N	2025-10-12 01:08:37.134439+00
66	Faculty Recruitment Committee	fevzi.okumus@ucf.edu	(407) 903-8177	\N	2025-10-12 01:08:37.35844+00
67	Dean Robert Ahdieh	cketter@pjmlaw.com	(773) 383-4089	\N	2025-10-12 01:08:37.517999+00
69	Tammy W. Cowart, J.d.	tcowart@uttyler.edu	(903) 566-7213	\N	2025-10-12 01:08:37.787868+00
70	Amanda J. Doherty Esq.	dohertyesq@aol.com	(917) 533-2615	\N	2025-10-12 01:08:37.941289+00
71	Ft. Worth, Texas	hvdraa.law@gmail.com	(224) 554-9095	\N	2025-10-12 01:08:38.063681+00
72	Natalie Dubose	natalie.dubose@haynesboone.com	+1 (214) 651-5313	\N	2025-10-12 01:08:38.17156+00
73	Randy M. Floyd	rmfloyd@me.com	(512) 810-9597	\N	2025-10-12 01:08:38.293139+00
74	Hiring Committee	jjf99@georgetown.edu	(724) 355-2891	\N	2025-10-12 01:08:38.43818+00
75	Hiring Committee	lindseyfries@ymail.com	(601) 830-6323	\N	2025-10-12 01:08:38.532161+00
76	Ilan Fuchs, Ph.d.	ilan.fuchs1@gmail.com	(125) 201-1299	\N	2025-10-12 01:08:38.949333+00
77	William Allen Galerston	wagalerston@iolagalerston.com	(214) 914-4673	\N	2025-10-12 01:08:39.1272+00
78	Page 1 Of 1	gibsonj5@byulaw.net	(918) 323-1567	\N	2025-10-12 01:08:39.23898+00
79	David J. Green, Esq.	davidgreenjag@gmail.com	(214) 846-4657	\N	2025-10-12 01:08:39.429125+00
31	Behavioral Health	dr.james.greenstone@gmail.com	(000) 652-0423	\N	2025-10-12 01:05:54.17552+00
81	John Gustincic, Jd	john.gustincic@gmail.com	(989) 423-3200	\N	2025-10-12 01:08:39.768365+00
82	Adam G. Gutbezahl	adam.gutbezahl@gmail.com	(508) 649-4216	\N	2025-10-12 01:08:39.868293+00
83	Lisa K. Halushka	lkhalushka@gmail.com	(248) 770-6717	\N	2025-10-12 01:08:39.975696+00
84	Robert Ahdieh	xakema.henderson@akerman.com	(214) 720-4372	\N	2025-10-12 01:08:40.124205+00
85	Kate Smith	katesmithesq@msn.com	(817) 479-0562	\N	2025-10-12 01:08:40.227223+00
86	Deanisha Hopson, Esq.	deanishah@gmail.com	(662) 402-1082	\N	2025-10-12 01:08:40.483934+00
87	Kemi Ijitimehin	kijitimehin@gmail.com	(404) 797-7330	\N	2025-10-12 01:08:40.624712+00
88	Anthony Fidel Iliakostas	a.iliakostas@gmail.com	(917) 751-2003	\N	2025-10-12 01:08:40.780433+00
89	Via Electronic Submission	airrobali@tillotsonlaw.com	(214) 382-3044	\N	2025-10-12 01:08:40.904981+00
91	Andy Jones	ajones.jd@gmail.com	(832) 492-1740	\N	2025-10-12 01:08:41.174168+00
92	Steven Jumes	steve@jumeslaw.com	(817) 212-7142	\N	2025-10-12 01:08:41.286704+00
93	James A. Kennedy	jamesaustinkennedy@gmail.com	(713) 349-4825	\N	2025-10-12 01:08:41.378976+00
94	Robert S. Kim	robertkim99@gmail.com	(703) 585-8114	\N	2025-10-12 01:08:41.482289+00
95	Brian Kinard	brian.kinard@gmail.com	(650) 868-6669	\N	2025-10-12 01:08:41.576717+00
96	Matthias Kleinsasser	mkleinsasser@winstead.com	(817) 420-8281	\N	2025-10-12 01:08:41.733975+00
102	John Loforese	johnloforese@gmail.com	(845) 987-4952	\N	2025-10-12 01:08:42.393044+00
103	Richie Malone	malone.richie@gmail.com	(832) 906-0445	\N	2025-10-12 01:08:42.548057+00
104	L.a. Martin	lauramartin155@gmail.com	(917) 379-3829	\N	2025-10-12 01:08:42.670564+00
105	Nicholas Merkin	nmerkin@usc.edu	(310) 623-0915	\N	2025-10-12 01:08:42.78248+00
106	Ashley Florek Miller	ashley.florek@gmail.com	(203) 260-4225	\N	2025-10-12 01:08:42.902377+00
108	Logan Moore	logan.moore@law.ua.edu	(337) 263-5138	\N	2025-10-12 01:08:43.045825+00
109	Dear Texas A&m Recruiters:	hihuck@hotmail.com	(915) 900-2828	\N	2025-10-12 01:08:43.167714+00
110	Shareholder, Practice Group Chair	autumn@nobleohanlonlaw.com	(402) 332-1596	\N	2025-10-12 01:08:43.295622+00
111	R Casey Oneill	r.casey.oneill@gmail.com	(817) 565-8806	\N	2025-10-12 01:08:43.396263+00
112	Haley M. Owen	haleyowen1208@gmail.com	(405) 641-6986	\N	2025-10-12 01:08:43.512511+00
113	Roger Pao	rpao@post.harvard.edu	(909) 573-7186	\N	2025-10-12 01:08:43.843001+00
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
