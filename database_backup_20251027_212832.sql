--
-- PostgreSQL database dump
--

\restrict qejhMjnrwVXeZCeQ1vWhCcLrGncgI5a3GOohxi8Yt5rGvvux5kwxssOVfC8GYLM

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);


ALTER TYPE public."NotificationStatus" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'EMAIL',
    'SMS'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'SUCCESSFUL',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TransactionType" AS ENUM (
    'CONTRIBUTION',
    'LOAN',
    'WITHDRAWAL',
    'FEE',
    'INVESTMENT',
    'REPAYMENT'
);


ALTER TYPE public."TransactionType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'SUPER_ADMIN',
    'APEX',
    'LEADER',
    'COOPERATIVE',
    'MEMBER',
    'BUSINESS',
    'FINANCE',
    'APEX_FUNDS',
    'NOGALSS_FUNDS',
    'PARENT_ORGANIZATION'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: EmergencyAlert; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmergencyAlert" (
    id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    severity text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL
);


ALTER TABLE public."EmergencyAlert" OWNER TO postgres;

--
-- Name: Partner; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Partner" (
    id text NOT NULL,
    name text NOT NULL,
    logo text NOT NULL,
    website text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Partner" OWNER TO postgres;

--
-- Name: Setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Setting" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: apex; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.apex (
    id text NOT NULL,
    "userId" text NOT NULL,
    region text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.apex OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text,
    action text NOT NULL,
    resource text NOT NULL,
    "resourceId" text,
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" text NOT NULL,
    "userAgent" text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dataProcessingActivityId" text
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: banks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banks (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.banks OWNER TO postgres;

--
-- Name: businesses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.businesses (
    id text NOT NULL,
    name text NOT NULL,
    "registrationNumber" text NOT NULL,
    "businessType" text NOT NULL,
    address text NOT NULL,
    "phoneNumber" text NOT NULL,
    email text NOT NULL,
    description text,
    logo text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.businesses OWNER TO postgres;

--
-- Name: charge_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.charge_records (
    id text NOT NULL,
    "transactionId" text,
    "userId" text NOT NULL,
    "cooperativeId" text,
    "businessId" text,
    "chargeType" text NOT NULL,
    "baseAmount" double precision NOT NULL,
    "chargeAmount" double precision NOT NULL,
    "chargePercentage" double precision NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paymentType" text NOT NULL,
    "paymentMethod" text NOT NULL,
    status text DEFAULT 'recorded'::text NOT NULL,
    description text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.charge_records OWNER TO postgres;

--
-- Name: consent_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consent_records (
    id text NOT NULL,
    "dataSubjectId" text NOT NULL,
    purpose text NOT NULL,
    "consentGiven" boolean NOT NULL,
    "consentDate" timestamp(3) without time zone NOT NULL,
    "withdrawalDate" timestamp(3) without time zone,
    "ipAddress" text NOT NULL,
    "userAgent" text NOT NULL,
    "consentVersion" text DEFAULT '1.0'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "dataProcessingActivityId" text
);


ALTER TABLE public.consent_records OWNER TO postgres;

--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'UNREAD'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: contributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contributions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "cooperativeId" text NOT NULL,
    amount numeric(65,30) NOT NULL,
    description text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.contributions OWNER TO postgres;

--
-- Name: cooperatives; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cooperatives (
    id text NOT NULL,
    name text NOT NULL,
    "registrationNumber" text NOT NULL,
    address text NOT NULL,
    "phoneNumber" text NOT NULL,
    email text NOT NULL,
    description text,
    logo text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "bankAccountNumber" text NOT NULL,
    "bankName" text NOT NULL,
    city text NOT NULL,
    approved boolean DEFAULT false,
    "approvedAt" timestamp(3) without time zone,
    "approvedBy" text,
    "bankId" text,
    "lgaId" text,
    "stateId" text,
    type text,
    "bankAccountName" text NOT NULL,
    "parentOrganizationId" text
);


ALTER TABLE public.cooperatives OWNER TO postgres;

--
-- Name: data_breaches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_breaches (
    id text NOT NULL,
    description text NOT NULL,
    categories text[],
    "approximateDataSubjects" integer NOT NULL,
    "likelyConsequences" text NOT NULL,
    "measuresProposed" text NOT NULL,
    "reportedToAuthority" boolean DEFAULT false NOT NULL,
    "reportedToDataSubjects" boolean DEFAULT false NOT NULL,
    "reportedAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'detected'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "reportedBy" text NOT NULL,
    "dataProcessingActivityId" text
);


ALTER TABLE public.data_breaches OWNER TO postgres;

--
-- Name: data_processing_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_processing_activities (
    id text NOT NULL,
    purpose text NOT NULL,
    "legalBasis" text NOT NULL,
    "dataCategories" text[],
    recipients text[],
    "retentionPeriod" integer NOT NULL,
    "securityMeasures" text[],
    "riskLevel" text DEFAULT 'low'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL
);


ALTER TABLE public.data_processing_activities OWNER TO postgres;

--
-- Name: data_retention_policies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_retention_policies (
    id text NOT NULL,
    "dataCategory" text NOT NULL,
    "retentionPeriod" integer NOT NULL,
    "legalBasis" text NOT NULL,
    description text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL
);


ALTER TABLE public.data_retention_policies OWNER TO postgres;

--
-- Name: data_subject_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_subject_requests (
    id text NOT NULL,
    "dataSubjectId" text NOT NULL,
    "requestType" text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    response text,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "handledBy" text
);


ALTER TABLE public.data_subject_requests OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    date timestamp(3) without time zone NOT NULL,
    "time" text,
    location text,
    image text,
    category text,
    attendees integer DEFAULT 0,
    "isPublished" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    amount numeric(65,30) NOT NULL,
    category text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "receiptUrl" text,
    "createdBy" text NOT NULL,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    "paidAt" timestamp(3) without time zone,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: investments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.investments (
    id text NOT NULL,
    "userId" text NOT NULL,
    "cooperativeId" text NOT NULL,
    amount integer NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "interestRate" numeric(65,30),
    "maturityAmount" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.investments OWNER TO postgres;

--
-- Name: leaders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leaders (
    id text NOT NULL,
    "userId" text NOT NULL,
    "cooperativeId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    approved boolean DEFAULT false,
    "approvedAt" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    role text,
    "startDate" timestamp(3) without time zone,
    title text,
    "bankAccountName" text,
    "bankAccountNumber" text,
    "bankName" text
);


ALTER TABLE public.leaders OWNER TO postgres;

--
-- Name: lgas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lgas (
    id text NOT NULL,
    name text NOT NULL,
    "stateId" text NOT NULL
);


ALTER TABLE public.lgas OWNER TO postgres;

--
-- Name: loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loans (
    id text NOT NULL,
    "userId" text NOT NULL,
    "cooperativeId" text NOT NULL,
    amount numeric(65,30) NOT NULL,
    purpose text NOT NULL,
    "interestRate" numeric(65,30) NOT NULL,
    duration integer NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "approvedBy" text,
    "approvedAt" timestamp(3) without time zone,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.loans OWNER TO postgres;

--
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    "userEmail" text NOT NULL,
    action text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_logs (
    id text NOT NULL,
    type public."NotificationType" NOT NULL,
    recipient text NOT NULL,
    subject text,
    message text NOT NULL,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    provider text,
    "providerId" text,
    cost double precision,
    "errorMessage" text,
    metadata jsonb,
    "sentAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notification_logs OWNER TO postgres;

--
-- Name: occupations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.occupations (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.occupations OWNER TO postgres;

--
-- Name: parent_organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parent_organizations (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "contactEmail" text NOT NULL,
    "contactPhone" text,
    address text,
    website text,
    logo text,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL,
    "userId" text,
    "defaultPassword" text
);


ALTER TABLE public.parent_organizations OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "userId" text NOT NULL,
    "cooperativeId" text,
    "businessId" text,
    amount numeric(65,30) NOT NULL,
    currency text DEFAULT 'NGN'::text NOT NULL,
    "paymentMethod" text DEFAULT 'PAYSTACK'::text NOT NULL,
    "paystackReference" text,
    "paystackAccessCode" text,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    metadata jsonb,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: pending_contributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_contributions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "cooperativeId" text NOT NULL,
    amount numeric(65,30) NOT NULL,
    reference text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pending_contributions OWNER TO postgres;

--
-- Name: pending_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_registrations (
    id text NOT NULL,
    type text NOT NULL,
    data text NOT NULL,
    reference text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.pending_registrations OWNER TO postgres;

--
-- Name: privacy_impact_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.privacy_impact_assessments (
    id text NOT NULL,
    "activityId" text NOT NULL,
    purpose text NOT NULL,
    "legalBasis" text NOT NULL,
    "dataCategories" text[],
    "riskLevel" text NOT NULL,
    "mitigationMeasures" text[],
    "dataMinimization" text NOT NULL,
    "purposeLimitation" text NOT NULL,
    "storageLimitation" text NOT NULL,
    accuracy text NOT NULL,
    security text NOT NULL,
    transparency text NOT NULL,
    "assessmentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "assessedBy" text NOT NULL,
    "approvedBy" text
);


ALTER TABLE public.privacy_impact_assessments OWNER TO postgres;

--
-- Name: states; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.states (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.states OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id text NOT NULL,
    category text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "updatedBy" text NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "cooperativeId" text,
    "businessId" text,
    type public."TransactionType" NOT NULL,
    amount numeric(65,30) NOT NULL,
    description text,
    reference text NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "sessionId" text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "phoneNumber" text,
    "dateOfBirth" timestamp(3) without time zone,
    address text,
    "profileImage" text,
    role public."UserRole" DEFAULT 'MEMBER'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cooperativeId" text,
    "businessId" text,
    title text,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text,
    "nextOfKinName" text,
    "nextOfKinPhone" text,
    nin text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: virtual_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.virtual_accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    "accountType" text NOT NULL,
    "accountName" text NOT NULL,
    "accountNumber" text NOT NULL,
    "bankName" text NOT NULL,
    "bankCode" text NOT NULL,
    "customerCode" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.virtual_accounts OWNER TO postgres;

--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawals (
    id text NOT NULL,
    "userId" text NOT NULL,
    amount numeric(65,30) NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "processedBy" text,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.withdrawals OWNER TO postgres;

--
-- Data for Name: EmergencyAlert; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmergencyAlert" (id, title, message, severity, "isActive", "createdAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: Partner; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Partner" (id, name, logo, website, description, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Setting" (id, key, value, "updatedAt") FROM stdin;
cmg8ah9ai000bjzn1cun4hi3b	registrationFee	5000	2025-10-01 17:57:37.956
cmg7xcrcm0000jzzvlktjjcdq	global_2fa_enabled	false	2025-10-07 00:42:34.06
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1cfc84c2-6903-440e-b4fb-46fef08d1be7	bce4185914289b6a50341a9418ec536cc8a71f25053671d9e3e2af991b19dd23	2025-09-28 21:50:51.763297+00	20250622112528_init	\N	\N	2025-09-28 21:50:49.616392+00	1
023473c2-d5d4-4d45-b8b4-2883f196c606	e800e18f4fd5c980f062c0c892253099fc46d0164d89d8cfa44a143673226cdb	2025-10-01 19:17:24.994177+00	20251001191721_add_pending_registration	\N	\N	2025-10-01 19:17:23.327929+00	1
0d81a266-6aff-48bf-9d90-27f1b65c3bd8	01f2ac0e250e426a3a3c7d8fe99049bb8b97046a556d6b8f7c1ca9d87bd30e9c	2025-09-28 21:50:55.001855+00	20250622180039_added_log_model	\N	\N	2025-09-28 21:50:52.342221+00	1
6650a3c8-1f8f-435d-81bf-a716d2138257	fa60d3407d73d48f1105fdd1f17a8a0df5f3f8338de2cce8890a678ac62b1c0a	2025-09-28 21:50:57.121991+00	20250622190810_update_cooperative_model	\N	\N	2025-09-28 21:50:55.65922+00	1
a5790a4a-a3c2-4600-a338-e8aae3f7ba42	82710875a024887b99f368a27b3cbde2e7e8e5cc6a4b02d76c09f7a146f1f5e5	2025-09-28 21:50:59.349051+00	20250624101115_make_fields_optional	\N	\N	2025-09-28 21:50:57.706868+00	1
34a529c1-ff87-4c92-b976-8d0dc2e9eca7	2024965f5440187216ba136eb93b7ab9ad8b0808aba88dd7ce6b51169514e6f6	2025-10-02 21:36:26.809522+00	20251002213623_add_pending_contribution	\N	\N	2025-10-02 21:36:25.190838+00	1
826708d9-00ef-4107-af93-0d20604c84b0	90411382f97a35f89b5a66b4888971cc087aa113ff2a4f1e8e1ae4f3b5963638	2025-09-28 21:51:01.712086+00	20250923013547_apex	\N	\N	2025-09-28 21:51:00.072543+00	1
ef0a9f81-d965-4433-b53b-15cee67a189f	5313f2507f56dcf00f80145317038ad6259ad0bdbbf6d5c57d2e0d9304ec1958	2025-09-28 21:51:04.259597+00	20250924171345_add_partner_model	\N	\N	2025-09-28 21:51:02.51861+00	1
6e145be3-a0d1-4727-ba5f-06463558fc1f	d4782b3ca773944414cf5ae27b77c15712770462bd523d3d4bb517b3ce9b8721	2025-09-28 21:51:06.412963+00	20250924175108_add_missing_user_roles	\N	\N	2025-09-28 21:51:04.85608+00	1
d299eec9-fa7d-420e-b09c-a64be93b0b16	f85221ae1d9d292f342c96a8247cd493afe7e6e50795d53d4f2044626c39e7f8	2025-10-02 22:29:09.939183+00	20251002222906_add_withdrawal_model	\N	\N	2025-10-02 22:29:08.247798+00	1
d2ae97e3-3afa-491b-85f1-3806b49e0066	335f2697a358a00a0a7510fc30d60beacecca09a882670424174c5a0c54cf136	2025-09-28 21:51:09.89424+00	20250925194819_add_2fa_fields	\N	\N	2025-09-28 21:51:07.952903+00	1
2e60a36f-87c9-4c6b-86e6-4dcbbe8f9ff7	a5dc88e33463783abcf2f66f4e3663da645298bf5dfcc9935d506668186357cd	2025-09-28 21:51:12.038766+00	20250926190701_add_session_management	\N	\N	2025-09-28 21:51:10.607796+00	1
720cb28c-db75-4319-bf1a-b2ccdcf474c5	4b6df35b268cf60b28f409113df9c84b070c7c36f8c6e42869f506ac2154ca97	2025-09-28 21:51:14.222839+00	20250926230211_add_emergency_alert	\N	\N	2025-09-28 21:51:12.676206+00	1
32280764-0694-40bf-bcea-541e9471c981	9377b039e46823e868b685c87d6ed8830ce15625f086b4557039715ddbe10e9e	2025-09-28 21:52:47.79334+00	20250928215242_add_notification_logs	\N	\N	2025-09-28 21:52:44.623005+00	1
64781065-81ed-4c0e-8e78-0428b21355da	37733c267034b51f94cdc783663dde415649241d16e62bb52e80d066ef31dcec	2025-10-01 14:34:26.696914+00	20251001143423_add_events_model	\N	\N	2025-10-01 14:34:25.192253+00	1
c4da60dd-e5d6-4b25-925b-f284ea320c31	b772d66fdccfc89d3dd144087c91784fc3cde3f8283bdcd0dbc6f1ca88eea0d1	2025-10-01 15:39:04.407964+00	20251001153901_add_bank_account_name_to_cooperative	\N	\N	2025-10-01 15:39:02.830342+00	1
\.


--
-- Data for Name: apex; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.apex (id, "userId", region, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, "userId", action, resource, "resourceId", "oldValues", "newValues", "ipAddress", "userAgent", "timestamp", "dataProcessingActivityId") FROM stdin;
\.


--
-- Data for Name: banks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banks (id, name) FROM stdin;
\.


--
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.businesses (id, name, "registrationNumber", "businessType", address, "phoneNumber", email, description, logo, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: charge_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.charge_records (id, "transactionId", "userId", "cooperativeId", "businessId", "chargeType", "baseAmount", "chargeAmount", "chargePercentage", "totalAmount", "paymentType", "paymentMethod", status, description, metadata, "createdAt", "updatedAt") FROM stdin;
cmgtpoheo0002jzmghlz78ovs	\N	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	\N	transaction_fee	5000	175	3.5	5175	leader_contribution	paystack	recorded	Leader contribution	{"leaderId": "cmg8gnnfk0005jzok2j1fqjmp", "feeCalculation": {"isFeeCapped": false, "isFeeWaived": false, "originalCalculation": {"fee": 175, "baseAmount": 5000, "isFeeCapped": false, "isFeeWaived": false, "totalAmount": 5175, "feePercentage": 3.5}}, "originalAmount": 5000}	2025-10-16 17:46:19.296	2025-10-16 17:46:19.296
cmgz54biq0001jz8w6skjfn3g	\N	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	\N	transaction_fee	5000	175	3.5	5175	leader_contribution	paystack	recorded	Leader contribution	{"leaderId": "cmg8gnnfk0005jzok2j1fqjmp", "feeCalculation": {"isFeeCapped": false, "isFeeWaived": false, "originalCalculation": {"fee": 175, "baseAmount": 5000, "isFeeCapped": false, "isFeeWaived": false, "totalAmount": 5175, "feePercentage": 3.5}}, "originalAmount": 5000}	2025-10-20 12:57:23.282	2025-10-20 12:57:23.282
cmgz599fg0005jz8wslhrtpl8	\N	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	\N	transaction_fee	5000	175	3.5	5175	leader_contribution	paystack	recorded	Leader contribution	{"leaderId": "cmg8gnnfk0005jzok2j1fqjmp", "feeCalculation": {"isFeeCapped": false, "isFeeWaived": false, "originalCalculation": {"fee": 175, "baseAmount": 5000, "isFeeCapped": false, "isFeeWaived": false, "totalAmount": 5175, "feePercentage": 3.5}}, "originalAmount": 5000}	2025-10-20 13:01:13.852	2025-10-20 13:01:13.852
cmh0ik9bs000bjzh48j8d6a8r	\N	cmh0igu840005jzh4chqzkqzu	cmh0igt320001jzh4awwhzzvg	\N	transaction_fee	5000	175	3.5	5175	leader_contribution	paystack	recorded	Leader contribution	{"leaderId": "cmh0igu840005jzh4chqzkqzu", "feeCalculation": {"isFeeCapped": false, "isFeeWaived": false, "originalCalculation": {"fee": 175, "baseAmount": 5000, "isFeeCapped": false, "isFeeWaived": false, "totalAmount": 5175, "feePercentage": 3.5}}, "originalAmount": 5000}	2025-10-21 12:01:28.12	2025-10-21 12:01:28.12
\.


--
-- Data for Name: consent_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consent_records (id, "dataSubjectId", purpose, "consentGiven", "consentDate", "withdrawalDate", "ipAddress", "userAgent", "consentVersion", "createdAt", "updatedAt", "dataProcessingActivityId") FROM stdin;
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, name, email, phone, subject, message, status, "isActive", "createdAt", "updatedAt") FROM stdin;
cmge85jsi0000jzgk81ungk2m	Central Bank of Nigeria	john@example.com	09071254060	fee	Business Hours\nMonday - Friday: 9:00 AM - 6:00 PM\n\nSaturday: 10:00 AM - 4:00 PM\n\nSunday: Closed	REPLIED	t	2025-10-05 21:39:09.458	2025-10-05 21:43:21.665
\.


--
-- Data for Name: contributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contributions (id, "userId", "cooperativeId", amount, description, date, "isActive", "createdAt", "updatedAt") FROM stdin;
cmg9y42hy0007jz1dven3uiyr	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	Member contribution via Paystack	2025-10-02 21:46:59.878	t	2025-10-02 21:46:59.878	2025-10-02 21:46:59.878
cmg9z4shb0001jz864qvmke4n	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	Member contribution via Paystack	2025-10-02 22:15:33.144	t	2025-10-02 22:15:33.167	2025-10-02 22:15:33.167
cmg9zm5g0000fjziy8f0fx6ym	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	Member contribution via Paystack	2025-10-02 22:29:03.12	t	2025-10-02 22:29:03.12	2025-10-02 22:29:03.12
cmga0mpbt000njziyb0jp6lb2	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	Member contribution via Paystack	2025-10-02 22:57:28.506	t	2025-10-02 22:57:28.506	2025-10-02 22:57:28.506
cmgahi5ow000wjziy1dioj6i9	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	500000.000000000000000000000000000000	Leader contribution of ₦5,000	2025-10-03 06:49:49.904	t	2025-10-03 06:49:49.904	2025-10-03 06:49:49.904
cmgaiasp1000yjziywcz5fsre	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	500000.000000000000000000000000000000	Leader contribution of ₦5,000	2025-10-03 07:12:06.085	t	2025-10-03 07:12:06.085	2025-10-03 07:12:06.085
cmgjhc85a0001jz9t1de453bi	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	500000.000000000000000000000000000000	Leader contribution of ₦5,000	2025-10-09 13:55:08.733	t	2025-10-09 13:55:08.733	2025-10-09 13:55:08.733
cmgtpoj2r0004jzmg164kagoj	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	500000.000000000000000000000000000000	Leader contribution of ₦5,000	2025-10-16 17:46:21.459	t	2025-10-16 17:46:21.459	2025-10-16 17:46:21.459
cmgz54cxj0003jz8wc7vhnlso	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	500000.000000000000000000000000000000	Leader contribution of ₦5,000	2025-10-20 12:57:25.111	t	2025-10-20 12:57:25.111	2025-10-20 12:57:25.111
cmgz59az50007jz8wgt9o1l37	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	500000.000000000000000000000000000000	Leader contribution of ₦5,000	2025-10-20 13:01:15.857	t	2025-10-20 13:01:15.857	2025-10-20 13:01:15.857
cmh0ikawv000djzh4okzg5qm8	cmh0igu840005jzh4chqzkqzu	cmh0igt320001jzh4awwhzzvg	500000.000000000000000000000000000000	Leader contribution of ₦5,000	2025-10-21 12:01:30.175	t	2025-10-21 12:01:30.175	2025-10-21 12:01:30.175
\.


--
-- Data for Name: cooperatives; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cooperatives (id, name, "registrationNumber", address, "phoneNumber", email, description, logo, "isActive", "createdAt", "updatedAt", "bankAccountNumber", "bankName", city, approved, "approvedAt", "approvedBy", "bankId", "lgaId", "stateId", type, "bankAccountName", "parentOrganizationId") FROM stdin;
cmg8gnlur0001jzoku128eac1	NOGALSS Cooperative 	FCT-2075	4th Floor Jibril Aminu House	09071254060	michaelike83@gmail.com	\N	\N	t	2025-10-01 20:50:32.164	2025-10-01 20:50:32.164	123456	Access Bank	amac	f	\N	\N	\N	\N	\N	\N	mi	\N
cmh0igt320001jzh4awwhzzvg	CreativemexyCar 	FCT-207523	4th Floor Jibril Aminu House	09139278437	ike@creativemexy.com.ng	\N	\N	t	2025-10-21 11:58:47.094	2025-10-21 11:58:47.094	1234560966	Access Bank	amac	f	\N	\N	\N	\N	\N	\N	creativemexy Car	\N
\.


--
-- Data for Name: data_breaches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_breaches (id, description, categories, "approximateDataSubjects", "likelyConsequences", "measuresProposed", "reportedToAuthority", "reportedToDataSubjects", "reportedAt", status, "createdAt", "updatedAt", "reportedBy", "dataProcessingActivityId") FROM stdin;
\.


--
-- Data for Name: data_processing_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_processing_activities (id, purpose, "legalBasis", "dataCategories", recipients, "retentionPeriod", "securityMeasures", "riskLevel", "isActive", "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: data_retention_policies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_retention_policies (id, "dataCategory", "retentionPeriod", "legalBasis", description, "isActive", "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: data_subject_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_subject_requests (id, "dataSubjectId", "requestType", description, status, response, "requestedAt", "completedAt", "handledBy") FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, title, description, date, "time", location, image, category, attendees, "isPublished", "isActive", "createdAt", "updatedAt", "createdBy") FROM stdin;
cmg83851p0001jzxkz8wrgbc2	Annual Cooperative Summit 2024	Join us for our annual summit where we discuss the future of cooperatives in Nigeria and share best practices.	2024-07-15 00:00:00	9:00 AM - 5:00 PM	Lagos Convention Centre	https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80	Summit	500	t	t	2025-10-01 14:34:35.533	2025-10-01 14:34:35.533	cmg4e5ohn0000jzejyo2x5llp
cmg8385m10003jzxkkwio89y7	Digital Transformation Workshop	Learn about the latest digital tools and technologies for cooperative management and member engagement.	2024-07-22 00:00:00	10:00 AM - 3:00 PM	Abuja Business Hub	https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80	Workshop	150	t	t	2025-10-01 14:34:36.265	2025-10-01 14:34:36.265	cmg4e5ohn0000jzejyo2x5llp
cmg8385um0005jzxkblr8jlqx	Financial Literacy Training	Empower your members with essential financial literacy skills for better cooperative management.	2024-08-05 00:00:00	2:00 PM - 6:00 PM	Port Harcourt Chamber of Commerce	https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80	Training	200	t	t	2025-10-01 14:34:36.574	2025-10-01 14:34:36.574	cmg4e5ohn0000jzejyo2x5llp
cmg8386310007jzxkltrrza85	Cooperative Leadership Conference	A successful conference that brought together cooperative leaders from across Northern Nigeria.	2024-06-10 00:00:00	9:00 AM - 5:00 PM	Kano State University	https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80	Conference	300	t	t	2025-10-01 14:34:36.877	2025-10-01 14:34:36.877	cmg4e5ohn0000jzejyo2x5llp
cmg8386bc0009jzxk3trgf6h4	Youth Cooperative Initiative Launch	Launch of our youth-focused cooperative initiative to engage young entrepreneurs.	2024-05-20 00:00:00	3:00 PM - 7:00 PM	Youth Development Centre, Enugu	https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80	Launch	250	t	t	2025-10-01 14:34:37.176	2025-10-01 14:34:37.176	cmg4e5ohn0000jzejyo2x5llp
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, title, description, amount, category, status, "receiptUrl", "createdBy", "approvedBy", "approvedAt", "paidAt", notes, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: investments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.investments (id, "userId", "cooperativeId", amount, type, status, description, "startDate", "endDate", "interestRate", "maturityAmount", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: leaders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leaders (id, "userId", "cooperativeId", "isActive", "createdAt", "updatedAt", approved, "approvedAt", "endDate", role, "startDate", title, "bankAccountName", "bankAccountNumber", "bankName") FROM stdin;
cmg8gnntq0007jzokk9qv0y9z	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	t	2025-10-01 20:50:34.718	2025-10-01 20:50:34.718	f	\N	\N	\N	\N	mr	\N	\N	\N
cmh0igujk0007jzh46svbs8ex	cmh0igu840005jzh4chqzkqzu	cmh0igt320001jzh4awwhzzvg	t	2025-10-21 11:58:48.99	2025-10-21 11:58:48.99	f	\N	\N	\N	\N	king	\N	\N	\N
\.


--
-- Data for Name: lgas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lgas (id, name, "stateId") FROM stdin;
\.


--
-- Data for Name: loans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loans (id, "userId", "cooperativeId", amount, purpose, "interestRate", duration, status, "approvedBy", "approvedAt", "startDate", "endDate", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logs (id, "userId", "userEmail", action, "timestamp") FROM stdin;
cmg56fti10000jz850qv9vlyw	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-29 13:41:14.132
cmg58m8680001jz85ujcvnsrp	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-29 14:42:12.316
cmg5jj68z0000jz996pzuglfo	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-29 19:47:45.624
cmg5kzxil0001jzzzuu32ja2w	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] APEX_USER_CREATED - {"targetEmail":"apexuser@nogalss.org","targetRole":"APEX","timestamp":"2025-09-29T20:28:46.469Z"}	2025-09-29 20:28:47.083
cmg5lhdei0002jzzzw3emb8eo	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-29 20:42:20.823
cmg5mmg940003jzzz7haeovi0	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_UNVERIFIED - {"targetUserIds":["cmg5kzwit0000jzzzr8jcz9r2"],"action":"unverify","timestamp":"2025-09-29T21:14:16.695Z"}	2025-09-29 21:14:17.413
cmg5mmj600004jzzz1daj9sad	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_UNVERIFIED - {"targetUserIds":["cmg5kzwit0000jzzzr8jcz9r2"],"action":"unverify","timestamp":"2025-09-29T21:14:20.576Z"}	2025-09-29 21:14:21.188
cmg5mw2hx0001jz019bizxhgl	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] APEX_USER_CREATED - {"targetEmail":"apexuser@nogalss.org","targetRole":"APEX","timestamp":"2025-09-29T21:21:45.497Z"}	2025-09-29 21:21:46.148
cmg5mxph70003jz01qya1txo6	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_VERIFIED - {"targetUserId":"cmg5mw1ie0000jz018d2ww3kk","targetEmail":"apexuser@nogalss.org","timestamp":"2025-09-29T21:23:01.692Z"}	2025-09-29 21:23:02.585
cmg5njwq30004jz01o4v3ovhf	cmg5mw1ie0000jz018d2ww3kk	apexuser@nogalss.org	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-29 21:40:18.408
cmg71zxp90000jzawj6xi45ow	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 21:12:26.969
cmg72fe3o0000jzs962bzpyk6	cmg5mw1ie0000jz018d2ww3kk	apexuser@nogalss.org	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 21:24:28.067
cmg72xb4h0001jzs9uztvqnc1	cmg5mw1ie0000jz018d2ww3kk	apexuser@nogalss.org	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 21:38:24.016
cmg72yf5e0002jzs93e262jet	cmg5mw1ie0000jz018d2ww3kk	apexuser@nogalss.org	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 21:39:15.888
cmg73iubw0000jzj9q2qx2f9t	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 21:55:08.683
cmg73mmp10003jzj9jv9tk3xc	cmg73lnie0001jzj9ncmngowt	finance@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 21:58:05.411
cmg73u6dv0004jzj9xgjhx16m	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 22:03:57.522
cmg73v1on0005jzj98z4ki840	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_VERIFIED - {"targetUserId":"cmg73lnie0001jzj9ncmngowt","targetEmail":"finance@nogalss.com","timestamp":"2025-09-30T22:04:37.810Z"}	2025-09-30 22:04:38.086
cmg73vuer0006jzj95q0ieb1u	cmg73lnie0001jzj9ncmngowt	finance@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 22:05:15.313
cmg74cekd0000jzqrp4giai58	cmg73lnie0001jzj9ncmngowt	finance@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 22:18:07.931
cmg74ipog0001jzqrxtio4p0i	cmg73lnie0001jzj9ncmngowt	finance@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 22:23:02.271
cmg74u6tx0000jza2p7iw5urs	cmg73lnie0001jzj9ncmngowt	finance@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-09-30 22:31:57.714
cmg7s7zy10001jza23rfjnoyl	cmg73lnie0001jzj9ncmngowt	finance@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-10-01 09:26:33.141
cmg7w9p2n0000jz0d7hb0mazi	cmg73lnie0001jzj9ncmngowt	finance@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-10-01 11:19:50.828
cmg7x3kb80001jz0duyaz7bua	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-10-01 11:43:04.339
cmg7x62yr0004jz0d8fckot6v	cmg7x5cve0002jz0d4zfivqbt	apexfund@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-10-01 11:45:01.826
cmg7xip5b0005jz0dam7kfzo9	cmg7x5cve0002jz0d4zfivqbt	apexfund@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-10-01 11:54:50.446
cmg7xmmes0006jz0dp7or1m21	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-10-01 11:57:53.523
cmg7xrjpl0007jz0dxtiate1y	cmg7x5cve0002jz0d4zfivqbt	apexfund@nogalss.com	[MEDIUM] USER_LOGIN - {"ipAddress":"unknown","userAgent":"unknown"}	2025-10-01 12:01:43.304
cmg7yu6xo0002jzwokqevf0gt	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_VERIFIED - {"targetUserId":"cmg7yt9cw0000jzwofr2m7n7i","targetEmail":"nogalss@nogalss.com","timestamp":"2025-10-01T12:31:46.041Z"}	2025-10-01 12:31:46.331
cmg7yuemm0003jzwovhxffewy	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_UNVERIFIED - {"targetUserId":"cmg7x5cve0002jz0d4zfivqbt","targetEmail":"apexfund@nogalss.com","timestamp":"2025-10-01T12:31:56.036Z"}	2025-10-01 12:31:56.301
cmg7yukrh0004jzwoj7gakb6j	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_VERIFIED - {"targetUserId":"cmg7x5cve0002jz0d4zfivqbt","targetEmail":"apexfund@nogalss.com","timestamp":"2025-10-01T12:32:03.983Z"}	2025-10-01 12:32:04.252
cmg87w5bs0009jzn1775yfcza	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[CRITICAL] IMPERSONATION_START - {"targetUserId":"cmg87b95j0006jzn1iky94rhr","targetUserEmail":"michealike83@gmail.com","timestamp":"2025-10-01T16:45:12.972Z","reason":"Admin impersonation","targetUserRole":"LEADER"}	2025-10-01 16:45:14.102
cmg881cbl000ajzn1re0b10ee	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[CRITICAL] IMPERSONATION_START - {"targetUserId":"cmg87b95j0006jzn1iky94rhr","targetUserEmail":"michealike83@gmail.com","timestamp":"2025-10-01T16:49:15.214Z","reason":"Admin impersonation","targetUserRole":"LEADER"}	2025-10-01 16:49:16.447
cmga1h29f000sjziy01z67tyg	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_VERIFIED - {"targetUserId":"cmg8gnmnn0003jzok1yh1e8e7","targetEmail":"michaelike83@gmail.com","timestamp":"2025-10-02T23:21:04.596Z"}	2025-10-02 23:21:04.946
cmga1h6uj000tjziynm0j3a18	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_VERIFIED - {"targetUserId":"cmg8gnnfk0005jzok2j1fqjmp","targetEmail":"creativemexy96@gmail.com","timestamp":"2025-10-02T23:21:10.476Z"}	2025-10-02 23:21:10.888
cmga1hcp3000ujziygk308sv1	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_VERIFIED - {"targetUserId":"cmg9cicsl0003jzenmhpdjgxf","targetEmail":"john@example.com","timestamp":"2025-10-02T23:21:18.057Z"}	2025-10-02 23:21:18.464
cmge8c3oa0000jzy06elmgxks	system	unknown	[MEDIUM] HEALTH_ALERT - {"alertId":"cpu-1759700654927","type":"WARNING","message":"High CPU usage: 82%","metric":"cpu_usage","value":82,"threshold":80,"timestamp":"2025-10-05T21:44:14.927Z"}	2025-10-05 21:44:15.514
cmge8c4dl0001jzy0yf30hnjr	system	unknown	[MEDIUM] HEALTH_ALERT - {"alertId":"db-response-1759700654927","type":"WARNING","message":"Slow database response: 1182ms","metric":"database_response_time","value":1182,"threshold":1000,"timestamp":"2025-10-05T21:44:14.927Z"}	2025-10-05 21:44:16.424
cmgfikvo10004jzatunyd9vy0	system	unknown	[MEDIUM] SETTINGS_UPDATED - {"updatedSettings":[{"category":"security","key":"passwordPolicy"},{"category":"security","key":"sessionTimeout"},{"category":"security","key":"twoFA"}],"updatedBy":"cmg4e5ohn0000jzejyo2x5llp"}	2025-10-06 19:18:47.374
cmgfrwzre00048xkvnihit7nm	system	unknown	[MEDIUM] SETTINGS_UPDATED - {"updatedSettings":[{"category":"security","key":"passwordPolicy"},{"category":"security","key":"sessionTimeout"},{"category":"security","key":"twoFA"}],"updatedBy":"cmg4e5ohn0000jzejyo2x5llp"}	2025-10-06 23:40:09.098
cmgtmfbn80000jz9gfx4ndoz9	system	unknown	[MEDIUM] HEALTH_ALERT - {"alertId":"cpu-1760631312166","type":"CRITICAL","message":"High CPU usage: 100%","metric":"cpu_usage","value":100,"threshold":80,"timestamp":"2025-10-16T16:15:12.166Z"}	2025-10-16 16:15:13.063
cmgtmfi980001jz9gflgzcb02	system	unknown	[MEDIUM] HEALTH_ALERT - {"alertId":"db-response-1760631312166","type":"WARNING","message":"Slow database response: 1251ms","metric":"database_response_time","value":1251,"threshold":1000,"timestamp":"2025-10-16T16:15:12.166Z"}	2025-10-16 16:15:21.641
cmgtphhng0000jzmgfxw4n5nw	cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	[MEDIUM] USER_VERIFIED - {"targetUserId":"cmgi0x2le0001jzct9l9dx8bk","targetEmail":"mercyzrt@gmail.com","timestamp":"2025-10-16T17:40:52.638Z"}	2025-10-16 17:40:53.019
\.


--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_logs (id, type, recipient, subject, message, status, provider, "providerId", cost, "errorMessage", metadata, "sentAt", "createdAt") FROM stdin;
cmgqasr200000jzvaf9otu55l	EMAIL	creativemexy96@gmail.com	Test Email from Nogalss	\n          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n            <h2>Test Email from Nogalss</h2>\n            <p>This is a test email to verify that the notification service is working correctly.</p>\n            <p><strong>Sent at:</strong> 10/14/2025, 9:26:22 AM</p>\n            <p>If you received this email, the notification service is working properly!</p>\n            <p>Best regards,<br>Nogalss Team</p>\n          </div>\n        	SENT	smtp	dev-log	\N	Logged in development mode	\N	2025-10-14 08:26:31.655	2025-10-14 08:26:25.655
cmg5mw30m0002jz01zehboy5p	EMAIL	apexuser@nogalss.org	Welcome to Nogalss – Apex User Account Created	\n    <div style="font-family: Arial, sans-serif; color: #222;">\n      <h2>Welcome to Nogalss, Apex!</h2>\n      <p>We're excited to have you on board.</p>\n      <h3>Your Login Details</h3>\n      <ul><li><b>Email:</b> apexuser@nogalss.org</li><li><b>Password:</b> Apex123!@#Secure</li></ul>\n      <h3>Your Role</h3>\n      <p>You are an Apex user. You can manage leaders, cooperatives, and oversee system operations.</p>\n      <h3>How to Use Your Dashboard</h3>\n      <p>Access your dashboard here: <a h	FAILED	resend	\N	\N	Failed to send email	\N	\N	2025-09-29 21:21:46.822
cmg73lnzy0002jzj951mhnw6v	EMAIL	finance@nogalss.com	Welcome to Nogalss – Finance User Account Created	\n    <div style="font-family: Arial, sans-serif; color: #222;">\n      <h2>Welcome to Nogalss, Finance!</h2>\n      <p>We're excited to have you on board.</p>\n      <h3>Your Login Details</h3>\n      <ul><li><b>Email:</b> finance@nogalss.com</li><li><b>Password:</b> Finance123!@</li></ul>\n      <h3>Your Role</h3>\n      <p>You are a Finance user. You can view all system-wide financial records, inflows, outflows, and generate reports.</p>\n      <h3>How to Use Your Dashboard</h3>\n      <p>Access your 	FAILED	smtp	\N	\N	Invalid login: 535 Incorrect authentication data	\N	\N	2025-09-30 21:57:20.446
cmg7x5dcz0003jz0dmeepctov	EMAIL	apexfund@nogalss.com	Welcome to Nogalss – Apex Funds User Account Created	\n    <div style="font-family: Arial, sans-serif; color: #222;">\n      <h2>Welcome to Nogalss, Apex!</h2>\n      <p>We're excited to have you on board.</p>\n      <h3>Your Login Details</h3>\n      <ul><li><b>Email:</b> apexfund@nogalss.com</li><li><b>Password:</b> Admin123!@#Secure</li></ul>\n      <h3>Your Role</h3>\n      <p>You are an Apex-Funds user. You can view and manage all Apex-level administrative funds.</p>\n      <h3>How to Use Your Dashboard</h3>\n      <p>Access your dashboard here: <a hr	FAILED	smtp	\N	\N	Invalid login: 535 Incorrect authentication data	\N	\N	2025-10-01 11:44:28.644
cmg7yt9uc0001jzwokx59u0l8	EMAIL	nogalss@nogalss.com	Welcome to Nogalss – Nogalss Funds User Account Created	\n    <div style="font-family: Arial, sans-serif; color: #222;">\n      <h2>Welcome to Nogalss, Noah!</h2>\n      <p>We're excited to have you on board.</p>\n      <h3>Your Login Details</h3>\n      <ul><li><b>Email:</b> nogalss@nogalss.com</li><li><b>Password:</b> Admin123!@#Secure</li></ul>\n      <h3>Your Role</h3>\n      <p>You are a Nogalss-Funds user. You can view and manage all Nogalss-level administrative funds.</p>\n      <h3>How to Use Your Dashboard</h3>\n      <p>Access your dashboard here: <	FAILED	smtp	\N	\N	Invalid login: 535 Incorrect authentication data	\N	\N	2025-10-01 12:31:03.444
cmg9y45m8000ajz1dwhiajed5	EMAIL	john@example.com	Payment Confirmation - Nogalss Cooperative	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #fb923c, #3b82f6); padding: 20px; text-align: center;">\n          <h1 style="color: white; margin: 0;">Nogalss Cooperative</h1>\n        </div>\n        \n        <div style="padding: 20px; background: #f9fafb;">\n          <h2 style="color: #1f2937;">Payment Confirmation</h2>\n          \n          <p>Dear Apex User,</p>\n          \n          <p>Your payment ha	SENT	smtp	dev-log	\N	Logged in development mode	\N	2025-10-02 21:47:09.491	2025-10-02 21:47:03.92
cmg9y4av0000bjz1dvflw0ble	SMS	098332288771	\N	Nogalss: Your payment of ₦1,000 has been confirmed. Ref: CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759441580549. Thank you!	FAILED	sms_provider	\N	\N	SMS API Error: Could not route mobile for delivery.	\N	\N	2025-10-02 21:47:10.717
cmg9yj1pi0006jziy87t6z61k	EMAIL	john@example.com	Payment Confirmation - Nogalss Cooperative	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #fb923c, #3b82f6); padding: 20px; text-align: center;">\n          <h1 style="color: white; margin: 0;">Nogalss Cooperative</h1>\n        </div>\n        \n        <div style="padding: 20px; background: #f9fafb;">\n          <h2 style="color: #1f2937;">Payment Confirmation</h2>\n          \n          <p>Dear Apex User,</p>\n          \n          <p>Your payment ha	SENT	smtp	dev-log	\N	Logged in development mode	\N	2025-10-02 21:58:43.524	2025-10-02 21:58:38.694
cmg9zmbdp000jjziytwcvr8hn	SMS	098332288771	\N	Nogalss: Your payment of ₦1,000 has been confirmed. Ref: CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759444015041. Thank you!	FAILED	sms_provider	\N	\N	SMS API Error: Could not route mobile for delivery.	\N	\N	2025-10-02 22:29:10.813
cmg9yj5w6000bjziyhb5n52a5	SMS	098332288771	\N	Nogalss: Your payment of ₦1,000 has been confirmed. Ref: CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759442167840. Thank you!	FAILED	sms_provider	\N	\N	SMS API Error: Could not route mobile for delivery.	\N	\N	2025-10-02 21:58:44.118
cmg9zm75r000ijziy8uier2py	EMAIL	john@example.com	Payment Confirmation - Nogalss Cooperative	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #fb923c, #3b82f6); padding: 20px; text-align: center;">\n          <h1 style="color: white; margin: 0;">Nogalss Cooperative</h1>\n        </div>\n        \n        <div style="padding: 20px; background: #f9fafb;">\n          <h2 style="color: #1f2937;">Payment Confirmation</h2>\n          \n          <p>Dear Apex User,</p>\n          \n          <p>Your payment ha	SENT	smtp	dev-log	\N	Logged in development mode	\N	2025-10-02 22:29:10.202	2025-10-02 22:29:05.343
cmga0mrl4000qjziyxp7igew6	EMAIL	john@example.com	Payment Confirmation - Nogalss Cooperative	\n      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n        <div style="background: linear-gradient(135deg, #fb923c, #3b82f6); padding: 20px; text-align: center;">\n          <h1 style="color: white; margin: 0;">Nogalss Cooperative</h1>\n        </div>\n        \n        <div style="padding: 20px; background: #f9fafb;">\n          <h2 style="color: #1f2937;">Payment Confirmation</h2>\n          \n          <p>Dear Apex User,</p>\n          \n          <p>Your payment ha	SENT	smtp	dev-log	\N	Logged in development mode	\N	2025-10-02 22:57:35.2	2025-10-02 22:57:31.432
cmga0muyc000rjziytt7fpq8y	SMS	098332288771	\N	Nogalss: Your payment of ₦1,000 has been confirmed. Ref: CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759445777759. Thank you!	FAILED	sms_provider	\N	\N	SMS API Error: Could not route mobile for delivery.	\N	\N	2025-10-02 22:57:35.796
cmgqasw4w0001jzvaz5yqeb6f	SMS	08153034486	\N	Test SMS from Nogalss - 10/14/2025, 9:26:32 AM. If you received this, the SMS service is working!	SENT	sms_provider	OK	6.5	\N	\N	2025-10-14 08:26:34.868	2025-10-14 08:26:32.24
cmgqc06kp0000jzhumijvo8mx	EMAIL	creativemexy96@gmail.com	Test Email from Nogalss	\n            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n              <h2>Test Email from Nogalss</h2>\n              <p>This is a test email to verify that the notification system is working correctly.</p>\n              <p><strong>Sent at:</strong> 10/14/2025, 10:00:08 AM</p>\n              <p>If you received this email, the notification system is working properly!</p>\n              <p>Best regards,<br>Nogalss Team</p>\n            </div>\n          	SENT	smtp	dev-log	\N	Logged in development mode	\N	2025-10-14 09:00:16.418	2025-10-14 09:00:11.978
cmgqc0afr0001jzhuzf1mrvif	SMS	08153034486	\N	Test SMS from Nogalss - 10/14/2025, 10:00:16 AM. If you received this, SMS notifications are working!	SENT	sms_provider	OK	6.5	\N	\N	2025-10-14 09:00:20.468	2025-10-14 09:00:16.983
cmgqc6jh60002jzhux28jdcnm	EMAIL	creativemexy96@gmail.com	Test Email from Nogalss	\n            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n              <h2>Test Email from Nogalss</h2>\n              <p>This is a test email to verify that the notification system is working correctly.</p>\n              <p><strong>Sent at:</strong> 10/14/2025, 10:05:08 AM</p>\n              <p>If you received this email, the notification system is working properly!</p>\n              <p>Best regards,<br>Nogalss Team</p>\n            </div>\n          	SENT	smtp	dev-log	\N	Logged in development mode	\N	2025-10-14 09:05:13.212	2025-10-14 09:05:08.369
cmgqcbz910000jz062wvysz9c	EMAIL	creativemexy96@gmail.com	Test Email from Nogalss	\n            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n              <h2>Test Email from Nogalss</h2>\n              <p>This is a test email to verify that the notification system is working correctly.</p>\n              <p><strong>Sent at:</strong> 10/14/2025, 10:09:18 AM</p>\n              <p>If you received this email, the notification system is working properly!</p>\n              <p>Best regards,<br>Nogalss Team</p>\n            </div>\n          	SENT	smtp	<e258fddf-7135-599f-f258-2a693e0007a0@nogalss.com>	\N	\N	\N	2025-10-14 09:09:27.755	2025-10-14 09:09:22.357
cmgqchv3y0001jz06m7l0smlu	EMAIL	creativemexy96@gmail.com	Test Email from Nogalss	\n            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n              <h2>Test Email from Nogalss</h2>\n              <p>This is a test email to verify that the notification system is working correctly.</p>\n              <p><strong>Sent at:</strong> 10/14/2025, 10:13:56 AM</p>\n              <p>If you received this email, the notification system is working properly!</p>\n              <p>Best regards,<br>Nogalss Team</p>\n            </div>\n          	SENT	smtp	<afd36d48-1812-4db8-9aab-e845e6ca3e45@nogalss.com>	\N	\N	\N	2025-10-14 09:14:01.294	2025-10-14 09:13:56.657
cmgqchyq10002jz06be81jnih	SMS	08153034486	\N	Test SMS from Nogalss - 10/14/2025, 10:14:01 AM. If you received this, SMS notifications are working!	SENT	sms_provider	OK	6.5	\N	\N	2025-10-14 09:14:05.93	2025-10-14 09:14:01.609
cmgqcwq8g0000jzysdolitzla	EMAIL	creativemexy96@gmail.com	Test Email from Nogalss	\n            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n              <h2>Test Email from Nogalss</h2>\n              <p>This is a test email to verify that the notification system is working correctly.</p>\n              <p><strong>Sent at:</strong> 10/14/2025, 10:25:23 AM</p>\n              <p>If you received this email, the notification system is working properly!</p>\n              <p>Best regards,<br>Nogalss Team</p>\n            </div>\n          	SENT	smtp	dev-log	\N	Logged in development mode	\N	2025-10-14 09:25:36.78	2025-10-14 09:25:30.448
cmgqd2amp0000jz9egvmjra9u	EMAIL	creativemexy96@gmail.com	Test Email from Nogalss	\n            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">\n              <h2>Test Email from Nogalss</h2>\n              <p>This is a test email to verify that the notification system is working correctly.</p>\n              <p><strong>Sent at:</strong> 10/14/2025, 10:29:47 AM</p>\n              <p>If you received this email, the notification system is working properly!</p>\n              <p>Best regards,<br>Nogalss Team</p>\n            </div>\n          	SENT	smtp	<bc8fdbba-1806-117c-4177-d04b7a7e9573@nogalss.org>	\N	\N	\N	2025-10-14 09:29:55.076	2025-10-14 09:29:50.158
cmh57urdg0004p49lgcatggof	EMAIL	hello@techshift.buzz	Welcome to Nogalss – Member Account Activated	\n    <div style="font-family: Arial, sans-serif; color: #222;">\n      <h2>Welcome to Nogalss, james!</h2>\n      <p>We're excited to have you on board.</p>\n      <h3>Your Login Details</h3>\n      <ul><li><b>Email:</b> hello@techshift.buzz</li><li><b>Password:</b> Hello2025@</li></ul>\n      <h3>Your Role</h3>\n      <p>You are a Member. You can make savings, apply for loans, and view your transaction history.</p>\n      <h3>How to Use Your Dashboard</h3>\n      <p>Access your dashboard here: <a href=	FAILED	smtp	\N	\N	Invalid login: 535 Incorrect authentication data	\N	\N	2025-10-24 19:00:33.172
\.


--
-- Data for Name: occupations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.occupations (id, name, "isActive", "createdAt", "updatedAt") FROM stdin;
cmgidr0400000jzjeoghsh3kw	Accountant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410001jzjek8e7xd62	Accounts Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410002jzjee78b88ee	Accounts Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410003jzje9fo7nu27	Accounts Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410004jzje6jrbcfru	Accounts Staff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410005jzjel6ss2sed	Acoustic Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410006jzjeyn1mw6el	Actor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410007jzjejcck9ut3	Actress	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410008jzjeew54w8wo	Actuary	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0410009jzje2a0wmlid	Acupuncturist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000ajzje7ubc3u1p	Adjustor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000bjzjeuczg9x0z	Administration Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000cjzje8c37u8a1	Administration Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000djzje2mlslf3u	Administration Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000ejzje33srfrzv	Administration Staff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000fjzjew71pqwyf	Administrator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000gjzjem49c8a4l	Advertising Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000hjzjephszad7w	Advertising Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000ijzjevlm8fmuk	Advertising Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr041000jjzje1m9bhkw7	Advertising Contractor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000kjzjejz4984pz	Advertising Executive	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000ljzjewlqus7o2	Advertising Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000mjzjejflps5c6	Advertising Staff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000njzjec9b0fwjv	Aerial Erector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000ojzjek6bpk9uh	Aerobic Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000pjzjevx1s3ywi	Aeronautical Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000qjzjew86eh6aa	Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000rjzjejiozwigz	Air Traffic Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000sjzjeoi72xrd5	Aircraft Designer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000tjzje5f8j9r9y	Aircraft Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000ujzjeb585hyse	Aircraft Maintenance Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000vjzjers3zzzm0	Aircraft Surface Finisher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000wjzje6lucj33z	Airman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000xjzjejes7srb5	Airport Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000yjzje6v7ehvp5	Airport Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr042000zjzje6qplcdyq	Almoner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0420010jzjeijgwklbo	Ambulance Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0420011jzjetaecp470	Ambulance Crew	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0420012jzjeriqph73c	Ambulance Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0420013jzjeamlu5jem	Amusement Arcade Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0420014jzjel2wehp9q	Anaesthetist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0420015jzjeg8qhvhcz	Analyst	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0430016jzjear4sa2gk	Analytical Chemist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0430017jzjec25rdlgr	Animal Breeder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0430018jzjemt23lqcx	Anthropologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0430019jzjed67n582k	Antique Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001ajzjeii4pxrf8	Applications Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001bjzjen1jaqx0c	Applications Programmer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001cjzje0rsvc3du	Arbitrator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001djzjero96m152	Arborist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001ejzje07p3yp7k	Archaeologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001fjzjel43jc1az	Architect	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001gjzje1tfqadgw	Archivist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001hjzjepxsv5mmo	Area Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001ijzjeftbo6cg7	Armourer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001jjzjesv1kit5v	Aromatherapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001kjzje90nx2y1f	Art Critic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001ljzjen473t5ei	Art Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001mjzjehfzr32go	Art Historian	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001njzjegb78ems3	Art Restorer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001ojzjejorkg2n8	Artexer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001pjzjexi3ffbqk	Artist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr043001qjzjemrwzqno0	Arts	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001rjzjec49q725v	Assembly Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001sjzjezz4kqtuy	Assessor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001tjzje6q11jj9o	Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001ujzjepsbxchp1	Assistant Caretaker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001vjzjecsl8jxto	Assistant Cook	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001wjzje40vzsuvm	Assistant Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001xjzjemofyv9a8	Assistant Nurse	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001yjzjezhqjjidj	Assistant Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044001zjzjeoezc1okr	Astrologer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440020jzje73uxeljn	Astronomer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440021jzjewsex4lc8	Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440022jzje2dvh2toq	Au Pair	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440023jzje7v6rl64j	Auction Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440024jzjei6ctbie6	Auctioneer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440025jzjeorfmx1jw	Audiologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440026jzje45bwplqx	Audit Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440027jzjev3bel34v	Audit Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440028jzjeogjdtmyv	Auditor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0440029jzje0si6zdt8	Auto Electrician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044002ajzjes0k15d5a	Auxiliary Nurse	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044002bjzje0pecvqw3	Bacon Curer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044002cjzje3zadmdz3	Baggage Handler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr044002djzje3qktq0qt	Bailiff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002ejzjege4to9wu	Baker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002fjzjedupdqoe5	Bakery Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002gjzjeqhlxguxs	Bakery Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002hjzjea3jhk9u6	Bakery Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002ijzje1dq8nocn	Balloonist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002jjzjer4y3vt3i	Bank Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002kjzjesu8jk4tp	Bank Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002ljzjebces404j	Bank Messenger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002mjzjeec9dg1tv	Baptist Minister	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002njzjeailcl47d	Bar Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002ojzjexat1s47f	Bar Steward	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002pjzjencn6upnl	Barber	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002qjzje0xh2vs5d	Barmaid	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002rjzjeyrloo7wf	Barman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002sjzje7dhbk0b2	Barrister	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002tjzjeje2qzi3m	Beautician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002ujzje516og9tb	Beauty Therapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002vjzjeyt3a89kf	Betting Shop	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002wjzjeuiwguvx5	Bill Poster	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002xjzje5zr1dbxx	Bingo Caller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002yjzjerzzjx2lp	Biochemist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr045002zjzjef3k5yjsx	Biologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0450030jzjey04gplqg	Blacksmith	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0450031jzjeu6chl5vv	Blind Assembler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0460032jzjegvcvfvf0	Blind Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0460033jzjezv8b14cy	Blinds Installer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0460034jzjej5a3kkbv	Boat Builder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0460035jzje7wwxjwfg	Body Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0460036jzjen1cgu7cr	Bodyguard	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0460037jzje5ipkcron	Bodyshop	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0460038jzjeso8133ro	Book Binder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0460039jzjexxcvppkx	Book Seller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr046003ajzjedp9k6cnu	Book-Keeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr046003bjzje0m0ldu6x	Booking Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr046003cjzjenbfv80me	Booking Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr046003djzjedswm2new	Bookmaker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr046003ejzjembj3exeg	Botanist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr046003fjzjeoo6i3735	Branch Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr046003gjzjeobw738il	Breeder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003hjzjege5x6ps5	Brewer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003ijzjes0rxydy1	Brewery Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003jjzjeycnfkskd	Brewery Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003kjzjeanvgkfia	Bricklayer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003ljzje042jmdi2	Broadcaster	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003mjzjell1vh0u1	Builder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003njzjek9aoj5lm	Builders Labourer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003ojzje7pvqc3ca	Building Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003pjzjetteki26k	Building Control	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003qjzjevotzyhsh	Building Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003rjzje528o0yf2	Building Estimator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003sjzje9mb6826j	Building Foreman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003tjzje6ic8qa4d	Building Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003ujzjex3cnvddi	Building Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003vjzjeaw4ne5j4	Building Surveyor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr047003wjzjeuc6ij7uz	Bursar	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048003xjzjedecy8enp	Bus Company	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048003yjzje6qrqdz9k	Bus Conductor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048003zjzjeo0ynfaz3	Bus Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480040jzje5e8z44p0	Bus Mechanic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480041jzje4t5gll5x	Bus Valeter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480042jzje59glxh1z	Business Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480043jzjedxr4vyvi	Business Proprietor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480044jzje31f6hn92	Butcher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480045jzjeykoe2xlj	Butchery Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480046jzjezepq4pq3	Butler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480047jzjeip7b8x9l	Buyer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480048jzjehj6jngg9	Cab Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0480049jzjeita5n9bd	Cabinet Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004ajzjep4oxea4n	Cable Contractor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004bjzjefzfkf6s0	Cable Jointer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004cjzjeknyuhz6m	Cable TV Installer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004djzjewdzfho33	Cafe Owner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004ejzjeg22dvv3p	Cafe Staff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004fjzjensgkewck	Cafe Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004gjzjezb0a397v	Calibration Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004hjzjel385ty0b	Camera Repairer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004ijzjerc5wb54h	Cameraman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004jjzjeo14vbfoj	Car Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr048004kjzje1pf79ace	Car Delivery Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004ljzjevblmbwi9	Car Park Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004mjzjewixyhhrn	Car Salesman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004njzjelmudm171	Car Valet	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004ojzje0k1d6vp5	Car Wash Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004pjzje0kvd473b	Care Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004qjzje8urrmyan	Care Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004rjzjestlbxeiu	Careers Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004sjzje85tdyshh	Careers Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004tjzje1t33yj8a	Caretaker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004ujzje0i00xpr4	Cargo Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004vjzjey06l6wvq	Carpenter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004wjzjehgf7wxph	Carpet Cleaner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004xjzjeny8536r6	Carpet Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004yjzjeleclkqp3	Carpet Retailer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr049004zjzjeeo3bq3kt	Carphone Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490050jzjegdd7fqph	Cartographer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490051jzje0egnj67v	Cartoonist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490052jzjej0p97ep5	Cashier	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490053jzjenykiqu1a	Casual Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490054jzjeq4p543rj	Caterer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490055jzjew9exxeq9	Catering Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490056jzjeiph11bhb	Catering Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490057jzjebu06eua8	Catering Staff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr0490058jzje4eq8qmq2	Caulker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a0059jzjei8o2l6h2	Ceiling Contractor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005ajzje0bhl0bds	Ceiling Fixer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005bjzjensuw6r5t	Cellarman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005cjzjequcmsnfo	Chambermaid	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005djzje05h59hc3	Chandler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005ejzjefoccl4fk	Chaplain	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005fjzjetuvz9g4r	Charge Hand	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005gjzje8c2zzrny	Charity Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005hjzje4vhanahy	Chartered	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005ijzjeztbbsd64	Chartered Accountant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005jjzjexk4cvsox	Chauffeur	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005kjzjeyr5kfeff	Chef	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005ljzjeh23sbo2h	Chemist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005mjzjegmmhhjbz	Chicken Chaser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005njzje0mbmxpb2	Child Minder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005ojzjek6qwx4ip	Childminder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005pjzje6hatmwvd	Chimney Sweep	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005qjzje8qzro3cs	China Restorer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005rjzjeedurygjy	Chiropodist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005sjzjehekh8nl6	Chiropractor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005tjzjemtolx6km	Choreographer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005ujzjezrscsggt	Church Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04a005vjzjewrjz1syq	Church Warden	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b005wjzjet4qmkbcb	Cinema Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b005xjzjewq0sw9eu	Circus Proprietor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b005yjzje1mg0p3w8	Circus Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b005zjzjefwutqbur	Civil Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0060jzjefj2rlpwh	Civil Servant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0061jzjeukxmac2s	Claims Adjustor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0062jzjekw1hbkmh	Claims Assessor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0063jzjeoi6fbwrz	Claims Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0064jzje2uau3lig	Clairvoyant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0065jzje74kzr3k1	Classroom Aide	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0066jzjesdfwpjst	Cleaner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0067jzje6rnpdo0g	Clergyman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0068jzjedmqvoh48	Cleric	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b0069jzje43pmw5ly	Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b006ajzjet4x7od0w	Commissioned	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b006bjzjex0jewflw	Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b006cjzjeq0ah8xkz	Coroner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04b006djzjejqtj9o3l	Councillor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006ejzje9a2yd1uh	Counsellor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006fjzje0o9tpetd	Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006gjzje47a6caar	Decorator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006hjzjeahzyz3sq	Delivery Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006ijzjet8chmzy1	Doctor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006jjzjel4cog0f2	Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006kjzjekqw1z82q	Economist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006ljzjef6hezdq5	Editor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006mjzjejy4i0gsd	Employee	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006njzje7689lkb3	Employment	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006ojzjelke2tilm	Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006pjzjevpn8n6md	English Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006qjzjedznqaygi	Entertainer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006rjzjes51hpyj2	Envoy	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006sjzjecp868919	Executive	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006tjzjek0mwqcvu	Farmer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006ujzje7wtbaeo3	Fireman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006vjzje0j0g37ih	Floor Layer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006wjzje3daejb3j	Floor Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006xjzjeil8lmwvw	Florist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006yjzje2zepmyfi	Flour Miller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c006zjzjeetlgou27	Flower Arranger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c0070jzjeztnrdt6q	Flying Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04c0071jzjelqg3fsso	Foam Convertor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d0072jzjeu19xv00b	Food Processor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d0073jzjefe993fx3	Footballer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d0074jzjetfme0lhi	Foreman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d0075jzje916dsq3n	Forensic Scientist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d0076jzjeto3ti335	Forest Ranger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d0077jzjepryh6m3c	Forester	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d0078jzjeuzcq5ssj	Fork Lift Truck Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d0079jzjethwwg5hm	Forwarding Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007ajzjeeomfllb7	Foster Parent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007bjzjechc1j6fu	Foundry Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007cjzje18hoew31	Fraud Investigator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007djzjezz1lgd6w	French Polisher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007ejzjevpju1f9f	Fruiterer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007fjzjehnbhc92f	Fuel Merchant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007gjzjehd1ip188	Fund Raiser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007hjzje4ozkzi19	Funeral Director	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007ijzje7keublpg	Funeral Furnisher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007jjzjej1lo3kdn	Furnace Man	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007kjzje1uep9yfw	Furniture Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007ljzjeedxqyj3j	Furniture Remover	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04d007mjzje06khyv2t	Furniture Restorer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007njzjewsxnyx48	Furrier	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007ojzje2bc1la0f	Gallery Owner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007pjzjeynwarlkv	Gambler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007qjzjekechwc56	Gamekeeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007rjzjexc5j9xz9	Gaming Board Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007sjzje6vl82fmm	Gaming Club Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007tjzjehurn5srv	Gaming Club Proprietor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007ujzjea0yrittr	Garage Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007vjzjef2wzrq8u	Garage Foreman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007wjzjek09s2fp0	Garage Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007xjzjemj2hrlxu	Garda	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007yjzjeyw3mgq7r	Garden Designer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e007zjzjegqmzj2wi	Gardener	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0080jzjegeu0pjkb	Gas Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0081jzjeh93chm9i	Gas Mechanic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0082jzjedjif0htu	Gas Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0083jzje0l7fio8r	Gate Keeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0084jzjes0wuqyu5	Genealogist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0085jzje7w7ogfpg	General Practitioner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0086jzjezj1kbwik	Geologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0087jzjejrli6lun	Geophysicist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0088jzjejcgh72z0	Gilder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e0089jzjestbi0cqh	Glass Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04e008ajzjenwnx1657	Glazier	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008bjzje22nw8v74	Goldsmith	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008cjzjeq6jmsc62	Golf Caddy	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008djzjedzu8wwi8	Golf Club Professional	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008ejzjex55lmcis	Golfer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008fjzjeuhkqq3dd	Goods Handler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008gjzjeyhhe76cm	Governor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008hjzjecoau16n9	Granite Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008ijzjesqwadjms	Graphic Designer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008jjzjehujv0z96	Graphologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008kjzjenvf2mak8	Grave Digger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008ljzjewsrqao7b	Gravel Merchant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008mjzje7xuqo41j	Green Keeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008njzje7v51e9o4	Greengrocer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008ojzje8fsr4evq	Grocer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04f008pjzje3s7ybvcf	Groom	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04g008qjzjekfxeccv5	Ground Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04g008rjzjea05syilr	Groundsman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04g008sjzjeyhjk8rp2	Guest House Owner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04g008tjzje19pr11og	Guest House Proprietor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04g008ujzje3k8365sn	Gun Smith	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h008vjzjeix14t5hj	Gynaecologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h008wjzjeu1ge8zu4	HGV Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h008xjzjee6srsx14	HGV Mechanic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h008yjzjetuzel1rs	Hairdresser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h008zjzjeqn8bksex	Handyman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0090jzjew4ynqep2	Hardware Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0091jzje3i8z3e9v	Haulage Contractor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0092jzje77mqthsz	Hawker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0093jzjebjwq9b0j	Health Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0094jzjewp1jkyww	Health And Safety	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0095jzjeyx59kldh	Health Care Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0096jzjehcm5773o	Health Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0097jzjeapgmm688	Health Nurse	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0098jzje4jwq2daq	Health Planner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h0099jzjelowpcwmi	Health Service	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h009ajzjewbrk3adc	Health Therapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h009bjzjeup6k3d2e	Health Visitor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h009cjzjetcn83o3u	Hearing Therapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h009djzjea07e2c8a	Heating Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h009ejzje7vkhoeun	Herbalist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h009fjzje8rrrivkn	Highway Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h009gjzjehvngp4gw	Hire Car Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04h009hjzje5bvg14y6	Historian	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009ijzje9451ejmz	History Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009jjzjehkqv4bqw	Hod Carrier	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009kjzjesvwys1ct	Home Economist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009ljzje729zamyb	Home Help	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009mjzjeudd85c50	Homecare Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009njzjea57tvses	Homeopath	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009ojzjeaaehg8fb	Homeworker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009pjzjejv652gdh	Hop Merchant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009qjzje69fs3p22	Horse Breeder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009rjzjevqabj3gz	Horse Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009sjzjezfzvghtn	Horse Riding Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009tjzje1f87egqh	Horse Trader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009ujzjedeqdioxq	Horse Trainer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009vjzjefixfpp34	Horticultural Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009wjzjetfiickjp	Horticulturalist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009xjzjex6xrk8pq	Hosiery Mechanic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009yjzjelhbcdv34	Hosiery Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i009zjzjepv2aedho	Hospital Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i00a0jzjeymn2be3k	Hospital Doctor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i00a1jzjeazfctorp	Hospital Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04i00a2jzjec0u7khm0	Hospital Orderly	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00a3jzjewbz87qba	Hospital Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00a4jzje2drllf16	Hospital Warden	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00a5jzje5xyt182x	Hospital Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00a6jzjexifqlt4n	Hostess	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00a7jzjep1f04dl8	Hot Foil Printer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00a8jzjeckfzd08e	Hotel Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00a9jzjeyy660nii	Hotel Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00aajzjedqjpfsj8	Hotelier	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00abjzje8gm4ra78	Househusband	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00acjzjedrga1ded	Housekeeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00adjzjey4goasxc	Housewife	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00aejzje4iyt5nbs	Housing Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00afjzjei5ilhh7d	Housing Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00agjzjeossvzwy2	Housing Supervisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00ahjzjei3vzvkiz	Hygienist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00aijzje6uh8pof5	Hypnotherapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00ajjzje9jxfipg7	Hypnotist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00akjzje6w7uv1nn	IT Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00aljzje0q5sec5u	IT Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00amjzjex0mi436c	IT Trainer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04j00anjzjec97y5rhz	Ice Cream Vendor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00aojzjefg0plk5u	Illustrator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00apjzjemnjyoovu	Immigration Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00aqjzjeygxzoz6i	Import Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00arjzjeruq4cgnd	Importer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00asjzjeus7e5hrm	Independent Means	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00atjzjetqr2zkqt	Induction Moulder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00aujzjeyv3syocw	Industrial Chemist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00avjzjeecxhv8yq	Industrial Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00awjzje7xsoyvzw	Injection Moulder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00axjzje8s60e318	Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00ayjzje7onrokmu	Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00azjzje1vbai40x	Instrument Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00b0jzjeusq902bn	Instrument Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00b1jzjedqwqtk2s	Instrument Supervisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00b2jzjeyxt3s5u5	Instrument Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00b3jzje2725e8yj	Insurance Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04k00b4jzjenwgx18a8	Insurance Assessor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00b5jzjeb91w5wq0	Insurance Broker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00b6jzjeqdozxapg	Insurance Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00b7jzjekucxb7mt	Insurance Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00b8jzjedlabt4h5	Insurance Staff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00b9jzje0c8hnt9n	Interior Decorator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bajzjekd7ezduh	Interior Designer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bbjzjekxq8xqz4	Interpreter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bcjzjenjcj066w	Interviewer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bdjzjep1prno6x	Inventor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bejzjepue6rwwy	Investigator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bfjzjed6dlqcru	Investment Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bgjzjensikgrcg	Investment Banker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bhjzje937s87qd	Investment Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bijzjev2gc74ue	Investment Strategist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bjjzjeh143bt9q	Ironmonger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bkjzjer5rd2yb2	Janitor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bljzje2xq5v7px	Jazz Composer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bmjzjepzkyog7g	Jeweller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bnjzjez8iz5bs0	Jewellery	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bojzje607ikxh7	Jockey	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bpjzje69gz3ags	Joiner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00bqjzje1g00hp1x	Joinery Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04l00brjzje1048wicf	Journalist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00bsjzje8nv64k8g	Judge	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00btjzjehr8no651	Keep Fit Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00bujzjeb5hvhzgq	Kennel Hand	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00bvjzjeqe5jsrux	Kitchen Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00bwjzjeqvydwmmg	Knitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00bxjzjeamy4tnps	Labelling Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00byjzjewlf54a57	Laboratory Analyst	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00bzjzjehn0rhd1h	Labourer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c0jzjen4627qu0	Laminator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c1jzjejq6vak27	Lampshade Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c2jzjet9kllucr	Land Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c3jzje2qh500u0	Land Surveyor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c4jzje3r1zc7d4	Landlady	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c5jzjeqztus8su	Landlord	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c6jzjeoxb1mdks	Landowner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c7jzje521jrm28	Landworker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c8jzjef9no03p8	Lathe Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00c9jzjedg77aixb	Laundry Staff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00cajzjek0rxig3x	Laundry Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04m00cbjzjetguvg8h4	Lavatory Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00ccjzjei193pepg	Law Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cdjzjejsmj74u9	Lawn Mower	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cejzje54bzi1dw	Lawyer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cfjzje0f15pyjo	Leaflet Distributor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cgjzjetehc4o4w	Leather Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00chjzjek34kxyjg	Lecturer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cijzjegmv9710o	Ledger Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cjjzjehnlu23z0	Legal Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00ckjzjeju893h7y	Legal Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cljzjewlbrsdpe	Legal Executive	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cmjzjeoao5n4du	Legal Secretary	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cnjzjervy477ae	Letting Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cojzjenc87njei	Liaison Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cpjzje6lpoh2j7	Librarian	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cqjzjejwgc0gxh	Library Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00crjzje6kzgtofh	Licensed Premises	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00csjzjeg18xfixl	Licensee	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00ctjzje3fa4zc6b	Licensing	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04n00cujzjexxf4ppy2	Lifeguard	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00cvjzje6cwciz82	Lift Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00cwjzjemwhy9wxy	Lift Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00cxjzjeyizbmur7	Lighterman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00cyjzjem2696ux8	Lighthouse Keeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00czjzjewxopzxeg	Lighting Designer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d0jzjede2jlrfh	Lighting Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d1jzje50d4h1go	Lime Kiln Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d2jzjeshp5101y	Line Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d3jzje4w32tvj3	Line Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d4jzjen7jp6pw8	Lineman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d5jzje7yfginif	Linguist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d6jzjembcc66of	Literary Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d7jzjeanue2w43	Literary Editor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d8jzjecrygxxc3	Lithographer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00d9jzjevzkl7rp0	Litigation Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00dajzjefzfsvqo9	Loans Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00dbjzjeec7hlo5d	Local Government	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00dcjzjeh6r0lmms	Lock Keeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00ddjzje6ki3r43x	Locksmith	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00dejzjelhknemws	Locum Pharmacist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00dfjzjegxqp31au	Log Merchant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04o00dgjzje47iu15ge	Lorry Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dhjzjeo946e3pr	Loss Adjustor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dijzjez7wg5inw	Loss Assessor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00djjzje4fmj0xi2	Lumberjack	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dkjzjes0hk2o6d	Machine Fitters	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dljzje3lkl6ogs	Machine Minder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dmjzjenslxsyko	Machine Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dnjzjeddnya3cx	Machine Setter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dojzje3vm6vcva	Machine Tool	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dpjzjesgtw03wf	Machine Tool Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dqjzjefphh9s5k	Machinist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00drjzje1nzv0e31	Magician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dsjzje0ystjs09	Magistrate	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dtjzjenx9ne20a	Magistrates Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dujzje0nlj3t0z	Maid	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dvjzjet8x065g0	Maintenance Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dwjzjeucqiwvvg	Make Up Artist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dxjzjewp429mtn	Manicurist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dyjzjedaqaywwr	Manufacturing	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00dzjzjeskl2rta8	Map Mounter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00e0jzje0bi9u17r	Marble Finisher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00e1jzjewdd1lap7	Marble Mason	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00e2jzjemwfl04rj	Marine Broker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04p00e3jzjet4txs8tm	Marine Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00e4jzjey3imtnkx	Marine Electrician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00e5jzjelhjtso0q	Marine Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00e6jzje2ihw99tl	Marine Geologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00e7jzjes4yv9q9m	Marine Pilot	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00e8jzje1jsvl2v0	Marine Surveyor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00e9jzjeuc92xwec	Market Gardener	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00eajzjef3kqz46l	Market Research	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00ebjzje8mn0494f	Market Researcher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00ecjzje22cjnwu9	Market Trader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00edjzjea9lf55po	Marketing Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00eejzjeer1h3ug0	Marketing Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00efjzjen7xrtsdo	Marketing Coordinator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00egjzjea8ljxrki	Marketing Director	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00ehjzjebmjrrbtl	Marketing Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00eijzjemjoymwti	Marquee Erector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00ejjzjem67fzzf3	Massage Therapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00ekjzjeo73ozkqb	Masseur	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00eljzjewy1y6w8z	Masseuse	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00emjzjeb0jvsna1	Master Mariner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00enjzje3n4z5714	Materials Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00eojzjeb5xxvtda	Materials Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04q00epjzjedd5fizfj	Mathematician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00eqjzje3t2mz8cf	Maths Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00erjzjejmubixcz	Matron	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00esjzjeg08cweys	Mattress Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00etjzjedf3tjxbq	Meat Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00eujzje3o5tvtfs	Meat Wholesaler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00evjzje5u4hefju	Mechanic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00ewjzjeak1tv7tu	Medal Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00exjzjesozl1k9x	Medical Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00eyjzjeejk22uit	Medical Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00ezjzjewkdzoyld	Medical Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f0jzjenzes9pmj	Medical Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f1jzjewjshguyw	Medical Physicist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f2jzjelcpad8gv	Medical Practitioner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f3jzje3vtfmcoc	Medical Researcher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f4jzje8epzb0pt	Medical Secretary	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f5jzje5zj4lrzq	Medical Student	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f6jzjeg1g41wwu	Medical Supplier	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f7jzje7mn7yuai	Medical Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f8jzjedvoiosr9	Merchandiser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00f9jzjekmmyvmfo	Merchant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00fajzje9yf5dqsg	Merchant Banker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00fbjzjetiwp19fa	Merchant Seaman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00fcjzje1q1v2ecl	Messenger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00fdjzjetpmqzzkl	Metal Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00fejzjeot2pteil	Metal Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04r00ffjzje920o2xi7	Metal Polisher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fgjzjedx2qsskp	Metal Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fhjzjed0hpnw2p	Metallurgist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fijzjehggxkobl	Meteorologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fjjzjewmb16ygg	Meter Reader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fkjzjeopk0mfjk	Microbiologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fljzjeh43otqkq	Midwife	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fmjzjex8ko832f	Military Leader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fnjzjefkzyw42k	Milklady	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fojzjeoqlrd5iz	Milkman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fpjzjebccqjkgp	Mill Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fqjzjevt1r7ijl	Mill Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00frjzjeuekua47d	Miller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fsjzje9sonw0xn	Milliner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00ftjzjer3h6qpk4	Millwright	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fujzjeko9a2zjm	Miner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fvjzje7jnqgm3a	Mineralologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fwjzjeoc6yljgx	Minibus Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fxjzjezwce6joc	Minicab Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fyjzjez2rmk4u3	Mining Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00fzjzjezkm13fuu	Mining Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00g0jzje5w7mfo7f	Money Broker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00g1jzjea9j8y7i9	Moneylender	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00g2jzjen3411kb7	Mooring Contractor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04s00g3jzjes0twcgwp	Mortgage Broker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00g4jzjeco6o4swv	Mortician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00g5jzjez1srlxwb	Motor Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00g6jzje41vltp79	Motor Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00g7jzje8qgo8kr1	Motor Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00g8jzjeio2qteys	Motor Mechanic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00g9jzjeosu2mg94	Motor Racing	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gajzje33nu0sgp	Motor Trader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gbjzjek7xebz9b	Museum Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gcjzjebmsgw4m2	Museum Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gdjzje7xv50482	Music Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gejzje2643ij7k	Musician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gfjzjeumr3fu5l	Nanny	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00ggjzjetwpuh6h2	Navigator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00ghjzje87w7pxhp	Negotiator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gijzjemdbumr31	Neurologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gjjzje7oko8as1	Newsagent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gkjzjeq8ahzgfs	Night Porter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gljzjeebacvkbs	Night Watchman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gmjzjecazweh0h	Nuclear Scientist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gnjzje41ddcfdi	Nun	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gojzje73i3wrtk	Nurse	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gpjzjec2tkx1kl	Nursery Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gqjzjez887v2ub	Nursery Nurse	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00grjzjeiz0fgn8u	Nursery Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04t00gsjzjetopai19p	Nurseryman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00gtjzje21qdge6u	Nursing Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00gujzjeu0ou5le0	Nursing Auxiliary	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00gvjzje8ut9ms2b	Nursing Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00gwjzjezsfmo9sp	Nursing Sister	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00gxjzjeyxaf9v5j	Nutritionist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00gyjzjeddvolkfh	Off Shore	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00gzjzjea4olq135	Office Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h0jzje9pxjxsfp	Office Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h1jzjee1e5ptui	Oil Broker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h2jzjeht1xumrq	Oil Rig Crew	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h3jzjey9byxazu	Opera Singer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h4jzjehrzp5vl5	Operations	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h5jzje2xtia157	Operative	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h6jzjeonz6sv05	Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h7jzjernoobg54	Optical	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h8jzjexj09ab15	Optical Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00h9jzjegayboirk	Optical Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00hajzjeirf0ax75	Optician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00hbjzje4m7sn32f	Optometrist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00hcjzjeqz1j4kmb	Orchestral	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00hdjzjekzmds4mi	Organiser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00hejzjedvaa4vd7	Organist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00hfjzjeob1zamq6	Ornamental	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00hgjzje21l611vj	Ornithologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04u00hhjzje4bxmilib	Orthopaedic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hijzje9ge48zpy	Orthoptist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hjjzje0unch3lg	Osteopath	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hkjzje7x7wwclv	Outdoor Pursuits	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hljzjegzkfdeh2	Outreach Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hmjzje6nwup70l	Packaging	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hnjzjei00ss0u2	Packer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hojzjek2musx9p	Paediatrician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hpjzjes4wq0bdc	Paint Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hqjzje5lswn8ys	Painter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hrjzje75p83hex	Palaeobotanist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hsjzjezw7q5geq	Palaeontologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00htjzjedy0nqc5o	Pallet Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hujzjei2f4wplx	Panel Beater	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hvjzjexe6jeao4	Paramedic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hwjzje5pf83df2	Park Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hxjzjeuwsdrbld	Park Keeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hyjzjewdxuvuw2	Park Ranger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00hzjzjetw79s4jc	Partition Erector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00i0jzjet6vh2df3	Parts Man	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00i1jzjecp4ex1t4	Parts Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00i2jzjeg2njwsl3	Parts Supervisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00i3jzjeo11g8hdj	Party Planner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00i4jzjei3v9tjm4	Pasteuriser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00i5jzjehihfyzb3	Pastry Chef	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04v00i6jzjebyi00lk9	Patent Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00i7jzjeopvjo8t7	Patent Attorney	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00i8jzjenbf7be4j	Pathologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00i9jzjeyxmpvtkk	Patrolman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00iajzje2slpqwwv	Pattern Cutter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00ibjzjex8dwfodi	Pattern Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00icjzjeocxdntyd	Pattern Weaver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00idjzje9y9eo31k	Pawnbroker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00iejzjep27ijzaz	Payroll Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00ifjzje3qsm6zxy	Payroll Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00igjzjeqfoo3656	Payroll Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00ihjzjedzwtqvn8	Payroll Supervisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00iijzjeetefmkgz	Personnel Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00ijjzje0vbvslyd	Pest Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00ikjzjevdcg1obw	Pet Minder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00iljzjetdvw6c7q	Pharmacist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00imjzjeutqe0zle	Philatelist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00injzjenb6k0dld	Photographer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00iojzje0tis1jna	Physician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00ipjzjexgo98tot	Physicist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00iqjzjebk4zsvl8	Physiologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00irjzjep6cxrb42	Physiotherapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00isjzjeu0ajbyyh	Piano Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00itjzjeuhnh4w59	Piano Tuner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04w00iujzjersjzaku1	Picture Editor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00ivjzjen27hmnry	Picture Framer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00iwjzje66qi36gw	Picture Reseacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00ixjzjezkv6hxai	Pig Man	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00iyjzje6was2x5d	Pig Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00izjzjepghv58s2	Pilot	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j0jzje2nmmn67w	Pipe Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j1jzjewtbdo1hk	Pipe Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j2jzjed1fp94o8	Pipe Insulator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j3jzje37avemkr	Pipe Layer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j4jzje9xa8appo	Planning Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j5jzjeg35lumch	Planning Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j6jzjevibcl146	Planning Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j7jzje7r6kdmrb	Planning Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j8jzjed8djizez	Plant Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00j9jzjedda7gres	Plant Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jajzjeurzuak6q	Plant Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jbjzjeu5h8o0ad	Plant Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jcjzjehnd4tksk	Plant Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jdjzjelkssrd15	Plant Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jejzjeeiokl63s	Plasterer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jfjzjen3f53yhh	Plastics Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jgjzjenl813aim	Plastics Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jhjzjesyw2a8ca	Plate Layer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jijzje447gbm5o	Plater	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04x00jjjzjeepy63r3t	Playgroup Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jkjzjer8rkxwoc	Playgroup Leader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jljzje2ou0w01c	Plumber	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jmjzjezws83k3k	Podiatrist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jnjzjeetgggb7y	Police Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jojzje791wtdg1	Polisher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jpjzjefn5mwio3	Pool Attendant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jqjzje9p9tptwc	Pools Collector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jrjzjeqam5a2n1	Porter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jsjzje2gymsern	Portfolio Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jtjzje8zs398xc	Post Sorter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jujzje1xljnw04	Postman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jvjzjef3c0m734	Postmaster	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jwjzje7mvhw7oh	Postwoman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jxjzje0e69zwh2	Potter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jyjzjevz6jb293	Practice Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00jzjzjeyj2nska7	Preacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00k0jzjemftsydix	Precision Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00k1jzjeab0tapy9	Premises	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00k2jzjegy1z6laq	Premises Security	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00k3jzjej4vazuf0	Press Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00k4jzje0zynqh0z	Press Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04y00k5jzje05p9aqfn	Press Setter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00k6jzje6gngrn91	Presser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00k7jzje19yak7g8	Priest	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00k8jzjeme6hh7zz	Print Finisher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00k9jzje2b3bc6ii	Printer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kajzje55ei514u	Prison Chaplain	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kbjzje5rhmxxq5	Prison Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kcjzjeoy8u042b	Private Investigator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kdjzje59d32pi0	Probation Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kejzje8ou3ps2s	Probation Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kfjzjeg0es4jb0	Procurator Fiscal	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kgjzjekpon758d	Produce Supervisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00khjzje7l1lf8fu	Producer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kijzjeor0nj3x3	Product Installer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kjjzjeajq0s83o	Product Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kkjzjea9nb5fj1	Production Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kljzjesejiaoju	Production Hand	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kmjzjetetis7yb	Production Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00knjzjeb6p6jkha	Production Planner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kojzjeeobcfo8q	Professional Boxer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kpjzjerww2sedr	Professional Racing	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr04z00kqjzje9n9pbpd9	Professional Wrestler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000krjzjer7v9k0i7	Progress Chaser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000ksjzjexrdqe6rd	Progress Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000ktjzjekmv8o90r	Project Co-ordinator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000kujzjedzbvxzxw	Project Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000kvjzjei5h9duqa	Project Leader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000kwjzjeul2ggigw	Project Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000kxjzjei4opotsh	Project Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000kyjzjeaqfp7zrs	Projectionist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000kzjzjeqaqrjqi3	Promoter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l0jzjepofsc6q6	Proof Reader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l1jzjeojzaammg	Property Buyer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l2jzjet4qphfnr	Property Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l3jzjezddj7x6n	Property Developer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l4jzjes9abdzla	Property Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l5jzjewqyuwsmc	Property Valuer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l6jzjeudyancl5	Proprietor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l7jzjeu6plpomd	Psychiatrist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l8jzjeboy3v5r2	Psychoanalyst	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05000l9jzjexvplxcuo	Psychologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lajzjekmvihaf5	Psychotherapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lbjzjerqfvqsxm	Public House Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lcjzje8uvboe5f	Public Relations Of?cer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100ldjzjet8h5y7ib	Publican	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lejzjeyk5k7log	Publicity Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lfjzjek0kx379d	Publisher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lgjzje3va9gwqk	Publishing Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lhjzjeb78erm54	Purchase Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lijzjedfqitevz	Purchase Ledger Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100ljjzjecme4gd8c	Purchasing Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lkjzje7w17szlq	Purchasing Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lljzjezkc5t4b8	Purser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lmjzje7305spw0	Quality Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lnjzjetdboob40	Quality Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lojzje1b0fv0x0	Quality Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lpjzje3h46f7rb	Quality Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lqjzje5gn0bk6n	Quality Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lrjzjelxhpciya	Quantity Surveyor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lsjzje1w4vrhgt	Quarry Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100ltjzjewre714ap	Racehorse Groom	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05100lujzjefjv13xmo	Racing Organiser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200lvjzje49bhyajb	Radio Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200lwjzjebco322kg	Radio Director	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200lxjzjeefzvmg1r	Radio Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200lyjzjebbscdfgp	Radio Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200lzjzjeulac0857	Radio Presenter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m0jzjem7p2ctjk	Radio Producer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m1jzjeaxuggjxj	Radiographer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m2jzje4ff310ma	Radiologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m3jzje6iida8t4	Rally Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m4jzjegnb8217v	Receptionist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m5jzjewsv66xu0	Recorder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m6jzjeya4wvzzh	Records Supervisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m7jzjerf0ibx20	Recovery Vehicle Coordinator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m8jzje259987yx	Recreational	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200m9jzjet25371ah	Recruitment Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200majzjej0wefb84	Rector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200mbjzjer85imv8s	Reflexologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200mcjzjea38z154o	Refractory Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200mdjzjemwuv06dx	Refrigeration Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200mejzje7rrpjspw	Refuse Collector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200mfjzjeskxv6rm4	Registrar	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05200mgjzjeq2m9htfx	Regulator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mhjzjeo8s27b0b	Relocation Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mijzje4muotu8e	Remedial Therapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mjjzje5pm2ymzu	Rent Collector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mkjzjeskgd090o	Rent Offcer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mljzje2bil141f	Repair Man	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mmjzjes5hixdsr	Repairer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mnjzjed4r4zrg8	Reporter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mojzje9dkjoqzb	Representative	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mpjzjep9mi934t	Reprographic Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mqjzjeitnv8hlr	Research Analyst	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mrjzjey5m4crug	Research Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300msjzje4s5xtnqu	Research Director	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mtjzjema0snrl3	Research Scientist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mujzjex1znn798	Research Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mvjzjevrkwmffc	Researcher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mwjzjee7uu2yrl	Resin Caster	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mxjzjei1h4w2uy	Restaurant Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300myjzjen9w3x176	Restaurateur	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300mzjzje3ms17thl	Restorer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05300n0jzjeeiq3q6v1	Retired	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n1jzjej82xiupk	Revenue Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n2jzjehbo012wk	Revenue Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n3jzje0lvs9cfs	Riding Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n4jzjeeaf6nnzo	Rig Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n5jzjepv2c7gyt	Rigger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n6jzjek4rmzgsr	Riveter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n7jzjeha4j2dm0	Road Safety Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n8jzjelhwddugf	Road Sweeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400n9jzjeg3wuxt5o	Road Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400najzjef5ugi5j5	Roadworker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400nbjzjexesqoois	Roof Tiler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400ncjzjewk6sva45	Roofer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400ndjzjeyisjqfod	Rose Grower	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400nejzjet23gexrk	Royal Marine	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400nfjzjessmv6kew	Rug Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400ngjzje8zeybmse	Saddler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400nhjzjejwa8b2jp	Safety Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400nijzje01nqjxx8	Sail Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400njjzjepspdqx33	Sales Administrator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05400nkjzjesx16nu6q	Sales Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nljzje3gzmlop6	Sales Director	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nmjzjecwdz8opv	Sales Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nnjzje46t3r985	Sales Executive	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nojzjepqv7p174	Sales Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500npjzjemjnhg3ca	Sales Representative	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nqjzje5s03o5xk	Sales Support	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nrjzjesj1dxrh8	Salesman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nsjzjex72i9iim	Saleswoman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500ntjzje0nabcz3u	Sand Blaster	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nujzjeu4bmuk8s	Saw Miller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nvjzjeo8jro8bz	Scaffolder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nwjzjew47xei3x	School Crossing	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nxjzjejoh2mlgh	School Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nyjzjeyll8gqb4	Scientific Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05500nzjzje3qh68jof	Scientist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o0jzje61ti4ifr	Scrap Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o1jzjegixk7kvk	Screen Printer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o2jzjeydf79fci	Screen Writer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o3jzjebp75mdyv	Script Writer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o4jzjegk29p87d	Sculptor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o5jzje71y5s64w	Seaman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o6jzjeneq98dd5	Seamstress	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o7jzje86ysvx4m	Secretary	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o8jzjeh10bc1x6	Security Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600o9jzjek8gir9wo	Security Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600oajzjevjig3w1j	Security Guard	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600objzjem2ya9n6l	Security Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600ocjzjeqxwcr9qd	Servant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600odjzjes1s18o03	Service Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05600oejzje0snqi0c9	Service Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700ofjzjecxoaef40	Share Dealer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700ogjzje5grfjry3	Sheet Metal Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700ohjzjekcwwr3vu	Shelf Filler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700oijzjejolixzo0	Shelter Warden	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700ojjzjewlbl9srp	Shepherd	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700okjzjef95mcuo5	Sheriff	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700oljzjen4edhhnx	Sheriff Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700omjzje4ui52c5t	Sheriff Principal	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700onjzjebp2a6ju0	Shift Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700oojzjensbqx98p	Ship Broker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700opjzjejr4h4r7d	Ship Builder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700oqjzjeg9eu1iow	Shipping Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700orjzjemh0va7fd	Shipping Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700osjzjekdn9uuf5	Shipwright	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05700otjzjebf5panic	Shipyard Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800oujzjejxedntlq	Shoe Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800ovjzjein7s59qa	Shoe Repairer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800owjzje8rne17tk	Shooting Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800oxjzjec5nepn17	Shop Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800oyjzje8t3ske46	Shop Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800ozjzjestg8w5qy	Shop Keeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p0jzje8dxmuhbq	Shop Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p1jzje38378x4n	Shop Proprietor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p2jzjeq1bkxpjd	Shot Blaster	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p3jzje9tw5gzm2	Show Jumper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p4jzjemscphohx	Showman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p5jzjepz7qkks3	Shunter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p6jzjeauf47hrq	Sign Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p7jzjetovrd5x5	Signalman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p8jzjedppu0ct8	Signwriter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800p9jzjejionh29n	Site Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800pajzjezuqtotxk	Site Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800pbjzjevw2ecuog	Skipper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800pcjzjec8q4nxd5	Slater	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800pdjzje20haz23m	Slaughterman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800pejzjeufag56fo	Smallholder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800pfjzje1y5fiild	Social Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800pgjzjeqkz1qbjz	Software Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800phjzjeuoggeno6	Software Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05800pijzje0axc3d6c	Soldier	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pjjzjeqozs4h71	Solicitor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pkjzjejw94edhi	Song Writer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pljzjejl2fkaiz	Sound Artist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pmjzjezzwy146e	Sound Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pnjzjeiaobdoul	Sound Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pojzjehc14m9p7	Special Constable	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900ppjzjen7afkjvy	Special Needs	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pqjzje0vsyjvv5	Speech Therapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900prjzje8aidku6n	Sports Administrator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900psjzjefobgwsxl	Sports Coach	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900ptjzje44ladwmz	Sports Commentator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pujzjepni6kug8	Sportsman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pvjzjem5qp5p7w	Sportsperson	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pwjzjetf2x4j8d	Sportswoman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pxjzjes32xn4x4	Spring Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pyjzjeasvfhj4k	Stable Hand	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900pzjzjef0m5z421	Staff Nurse	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900q0jzjevm439xkc	Stage Director	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900q1jzjelc6wq3ix	Stage Hand	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900q2jzjevs70fxu9	Stage Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900q3jzje9infv37p	Stage Mover	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05900q4jzjesg57ejtw	Station Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00q5jzje1987p7jd	Stationer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00q6jzje6tfjf4tm	Statistician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00q7jzjeriwcwplw	Steel Erector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00q8jzjesyfn4g70	Steel Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00q9jzjey2d4l1i6	Steeplejack	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qajzjetjzjca64	Stenographer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qbjzjebmly6pls	Steward	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qcjzjet7onuy0o	Stewardess	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qdjzje90t46o6l	Stock Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qejzjeqelkgo57	Stock Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qfjzjeijbtac0r	Stockbroker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qgjzjeukvnn51i	Stockman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qhjzjezye44owt	Stocktaker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qijzje74qf2foz	Stone Cutter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qjjzjeut3gxemk	Stone Sawyer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qkjzjemm03p6yy	Stonemason	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qljzjebdmwlkl9	Store Detective	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qmjzjey5c4cneu	Storeman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qnjzjegfrwwlh2	Storewoman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qojzjef56c6yox	Street Entertainer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qpjzjefri72g75	Street Trader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qqjzjef93cxxug	Stud Hand	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05a00qrjzjea4rzsc0b	Student	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00qsjzje0bi1pldw	Student Nurse	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00qtjzjeq71hxw67	Student Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00qujzje477bsn8a	Studio Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00qvjzje5juu06a3	Sub-Postmaster	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00qwjzjeb9jctjup	Sub-Postmistress	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00qxjzjehxqupmt4	Supervisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00qyjzje94yi9zfn	Supply Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00qzjzjezt0ox52f	Surgeon	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r0jzjekprivc3n	Surveyor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r1jzje3ezel42e	Systems Analyst	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r2jzjeqauvgmo2	Systems Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r3jzjejsrhvy6a	Systems Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r4jzjev6h3ajsf	TV Editor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r5jzjerx93oest	Tachograph Analyst	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r6jzje02lhqaa3	Tacker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r7jzjemsqq755b	Tailor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r8jzjerwrad4mq	Tank Farm Operative	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00r9jzje4mitcatb	Tanker Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05b00rajzjemdgkya3p	Tanner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rbjzjet1vbirv0	Tattooist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rcjzje5f09n3ey	Tax Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rdjzje88bn0lws	Tax Analyst	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rejzjen9sz8oby	Tax Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rfjzjeq4f5rqt4	Tax Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rgjzje36gje2g9	Tax Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rhjzjelxoqqn3g	Tax Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rijzjelvk54r44	Tax Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rjjzjeolin7xab	Taxi Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rkjzjesb7y3bo0	Taxi Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rljzjegbglbd75	Taxidermist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rmjzje4prhnkvq	Tea Blender	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rnjzje9a4l43yd	Tea Taster	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rojzjeb8ob8iww	Teacher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rpjzje4l959xf8	Teachers Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rqjzjefa3pk1ky	Technical Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rrjzjeaqhmfcg5	Technical Analyst	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rsjzjexvav16ij	Technical Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rtjzjew27jwbv6	Technical Author	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rujzje02hb25gs	Technical Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rvjzjeqzisw2mn	Technical Co-ordinator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rwjzjeoc3wo6c2	Technical Director	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00rxjzjehpoz0ucl	Technical Editor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05c00ryjzje8gf4tjzy	Technical Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00rzjzjef4wuz0t5	Technical Illustrator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s0jzje4g7l9xiv	Technical Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s1jzjeqnzq4v0j	Technical Liaison	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s2jzjetfyl5did	Technical Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s3jzjeh0njmnoq	Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s4jzjek2s53xip	Telecommunication	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s5jzjeoe7ofzv6	Telecommunications	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s6jzjeh2scnj65	Telegraphist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s7jzjel8ytkrvf	Telemarketeer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s8jzjeeihigdzu	Telephone Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00s9jzjetdojqwvp	Telephonist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00sajzjei7br005d	Telesales Person	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00sbjzjekkvua2en	Television Director	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00scjzjeeonc5ujm	Television Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00sdjzjehncrwyfg	Television Presenter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00sejzje1i9rdr92	Television Producer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00sfjzjekwbw7wdo	Telex Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05d00sgjzje8e26r4dr	Temperature Time	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00shjzje5uv0q5ym	Tennis Coach	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00sijzjentfaxoj6	Textile Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00sjjzjedj5tqcu1	Textile Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00skjzjer7yzpf7y	Textile Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00sljzjef3aphvpo	Textile Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00smjzjed7zioxt7	Thatcher	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00snjzjeer5ktbkl	Theatre Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00sojzje7nt43o9e	Theatre Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00spjzje1b5ttt7y	Theatrical Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00sqjzjeqau81zxh	Therapist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00srjzjea38o2ftv	Thermal Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00ssjzjeo10qai9m	Thermal Insulator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00stjzjeraaevm44	Ticket Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00sujzje6e26devr	Ticket Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00svjzje4pdk90nj	Tiler	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05e00swjzjejpyrdh3f	Timber Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00sxjzjedmyz7cmh	Timber Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00syjzjeqm8c5kng	Tobacconist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00szjzjenvias5si	Toll Collector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t0jzjeowewallu	Tool Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t1jzjecyc5daaf	Tour Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t2jzjed7dec1fw	Tour Guide	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t3jzjeodwz63zr	Town Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t4jzjesqce340g	Town Planner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t5jzje27ueau3z	Toy Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t6jzjeuh7s19ay	Toy Trader	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t7jzjekjaq99vy	Track Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t8jzjefy186ltv	Tractor Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00t9jzjesnplfrax	Tractor Mechanic	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tajzjeiq4rgx8m	Trade Mark Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tbjzje9we4x5nd	Trade Union Official	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tcjzje88f9426a	Trading Standards	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tdjzjejgwic0qd	Traffic Warden	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tejzjeijjdvsfa	Train Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tfjzjefpao0sz8	Trainee Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tgjzjeqb0escwh	Training Advisor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00thjzjeaze7mo6o	Training Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tijzje0glapfmh	Training Co-ordinator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tjjzje93yjy722	Training Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tkjzjefg1izv0e	Training Instructor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tljzjez9hrgxge	Training Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tmjzjedakfn1os	Training Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tnjzjeivri8fms	Transcriber	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05f00tojzje772p04wd	Translator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00tpjzje364fh711	Transport Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00tqjzjeofrl8xcn	Transport Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00trjzjetu4ap275	Transport Controller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00tsjzje977mp581	Transport Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00ttjzjeo2gb9lr6	Transport Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00tujzjegqanl7v8	Transport Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00tvjzjeefrh4swn	Transport Planner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00twjzje75b3nrp7	Travel Agent	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00txjzjeqdiu1a7j	Travel Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00tyjzje9ub5b9f7	Travel Consultant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00tzjzjectmigvep	Travel Courier	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u0jzje80wbxkb4	Travel Guide	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u1jzje8ohue333	Travel Guide Writer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u2jzjevbh91l31	Travel Representative	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u3jzjexqxr1arp	Travelling Showman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u4jzjeyiikdrgd	Treasurer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u5jzjekvy2aoba	Tree Feller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u6jzje5ipz8tg5	Tree Surgeon	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u7jzjesk9dv4qh	Trichologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u8jzje89g5l847	Trinity House Pilot	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00u9jzje9h5uwsku	Trout Farmer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00uajzjeiz3pppii	Tug Skipper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00ubjzjemhssqv5e	Tunneller	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00ucjzje7slt7ia6	Turf Accountant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00udjzjeaoxdej33	Turkey Farmer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00uejzjehv2n5rmn	Turner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00ufjzjemum2oaan	Tutor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00ugjzje7dng9z3k	Typesetter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00uhjzjeutx7wq00	Typewriter Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05g00uijzjew0ttflsk	Typist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00ujjzjerish0nb8	Tyre Builder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00ukjzjettv2okr1	Tyre Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uljzjejdehrz9u	Tyre Inspector	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00umjzjef3729waf	Tyre Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00unjzjet09m5t0z	Undertaker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uojzje6c4gq2el	Underwriter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00upjzjetfx9vqo6	Upholsterer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uqjzje1r0dl3mv	Valuer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00urjzjex4h4fwhe	Valve Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00usjzje7rlbgwmb	Van Driver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00utjzjeh61c8xil	Vehicle Assessor	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uujzjejapo0yuw	Vehicle Body Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uvjzjewz20aqn8	Vehicle Engineer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uwjzjeuxhwe0ci	Vehicle Technician	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uxjzje8lc6dheq	Ventriloquist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uyjzjeye6k3znr	Verger	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00uzjzjeiitzbr0c	Veterinary Surgeon	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v0jzjey9hroh8y	Vicar	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v1jzjeco0yfvfj	Video Artist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v2jzjellb87n2n	Violin Maker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v3jzje0l48y1t8	Violinist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v4jzjebrx1wkln	Voluntary Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v5jzje7f9kktg9	Wages Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v6jzjebldgo6j4	Waiter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v7jzjeiercdxf7	Waitress	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v8jzjef46y9mks	Warden	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00v9jzjeexiipw27	Warehouse Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00vajzjeav3c7zsh	Warehouseman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05h00vbjzjeb5fjim0j	Warehousewoman	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vcjzjezjni2stb	Watchmaker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vdjzjeldg082hs	Weaver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vejzjek4uh755g	Weighbridge Clerk	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vfjzje05qwyt0r	Weighbridge Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vgjzje1lolziv2	Welder	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vhjzjei8mklzg7	Welfare Assistant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vijzjeyvn06h7k	Welfare Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vjjzjeey1h72f0	Welfare Rights Officer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vkjzje9fw0lzo3	Wheel Clamper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vljzje1j4rz2h8	Wholesale Newspaper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vmjzjevgidwkas	Window Cleaner	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vnjzjeyshsv7qi	Window Dresser	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vojzjeckwnylpi	Windscreen Fitter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vpjzjefshkyqrs	Wine Merchant	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vqjzjeliiothn7	Wood Carver	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vrjzjel1tqtdua	Wood Cutter	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vsjzjemip3cs1c	Wood Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vtjzjea6vmsbk6	Word Processing Operator	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vujzje4pz1kg6u	Works Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vvjzjeo49ejev0	Writer	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vwjzjecwumg9ts	Yacht Master	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vxjzje7lbmidoq	Yard Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vyjzjeli65dcd4	Youth Hostel Warden	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05i00vzjzjet2za5tj7	Youth Worker	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05j00w0jzjeze38av4s	Zoo Keeper	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05j00w1jzjet6mpv9cz	Zoo Manager	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
cmgidr05j00w2jzjecw4gaidw	Zoologist	t	2025-10-08 19:26:53.504	2025-10-08 19:26:53.504
\.


--
-- Data for Name: parent_organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parent_organizations (id, name, description, "contactEmail", "contactPhone", address, website, logo, "parentId", "isActive", "createdAt", "updatedAt", "createdBy", "userId", "defaultPassword") FROM stdin;
cmgqacm7a0003jzwmwp6q48uw	mexy		mexereum@gmail.com	8153034486	8717 W110th St Suite 220			\N	t	2025-10-14 08:13:52.87	2025-10-14 08:13:52.87	cmg4e5ohn0000jzejyo2x5llp	cmgqaclq00001jzwmnyc5r4oe	Parpass@25
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, "transactionId", "userId", "cooperativeId", "businessId", amount, currency, "paymentMethod", "paystackReference", "paystackAccessCode", status, metadata, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: pending_contributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_contributions (id, "userId", "cooperativeId", amount, reference, status, "createdAt", "updatedAt") FROM stdin;
cmg9xuqyn0003jz1d9zxcymez	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759441183432	PENDING	2025-10-02 21:39:45.023	2025-10-02 21:39:45.023
cmg9y394j0005jz1dosll5ydu	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759441580549	FAILED	2025-10-02 21:46:21.811	2025-10-02 21:47:15.086
cmg9yfus20001jziyu5hettlf	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759442167840	FAILED	2025-10-02 21:56:09.746	2025-10-02 21:58:44.489
cmg9zjfx1000djziygw60awaz	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759444015041	COMPLETED	2025-10-02 22:26:56.725	2025-10-02 22:29:04.214
cmga0l83m000ljziyptcp8ntw	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	100000.000000000000000000000000000000	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759445777759	COMPLETED	2025-10-02 22:56:19.522	2025-10-02 22:57:30.031
\.


--
-- Data for Name: pending_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_registrations (id, type, data, reference, status, "createdAt", "updatedAt") FROM stdin;
cmg8du0iq0000jzsn2v8d1oiz	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"122222222222","bankAccountName":"nogalss","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"Yemisi","leaderLastName":"Bankole","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss25@","leaderPhone":"0907123434","leaderTitle":"Dr"}	REG_1759347092255	PENDING	2025-10-01 19:31:32.258	2025-10-01 19:31:32.258
cmg8dy8c40001jzsnr4s2l2ty	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"122222222222","bankAccountName":"nogalss","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"Yemisi","leaderLastName":"Bankole","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss25@","leaderPhone":"0907123434","leaderTitle":"Dr"}	REG_1759347289012	PENDING	2025-10-01 19:34:49.013	2025-10-01 19:34:49.013
cmg8e3jmp0002jzsnfkoo531y	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"122222222222","bankAccountName":"nogalss","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"Yemisi","leaderLastName":"Bankole","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss25@","leaderPhone":"0907123434","leaderTitle":"Dr"}	REG_1759347536928	PENDING	2025-10-01 19:38:56.93	2025-10-01 19:38:56.93
cmg8eev390003jzsnycdahd3n	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"1234567890","bankAccountName":"mummm","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"me","leaderLastName":"me","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss2025@","leaderPhone":"09098765432","leaderTitle":"mu"}	REG_1759348064996	PENDING	2025-10-01 19:47:44.997	2025-10-01 19:47:44.997
cmg8emba50004jzsnpw0d0mqb	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"18888888888","bankAccountName":"me me","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"tesy","leaderLastName":"tesy","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss2025@","leaderPhone":"09088777712","leaderTitle":"DR"}	REG_1759348412572	PENDING	2025-10-01 19:53:32.574	2025-10-01 19:53:32.574
cmg8ete6g0005jzsn1bmhammj	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"123456789","bankAccountName":"me ,e","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"mecy","leaderLastName":"mexy","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss2025@","leaderPhone":"0908714555","leaderTitle":"Dr"}	REG_1759348742918	PENDING	2025-10-01 19:59:02.92	2025-10-01 19:59:02.92
cmg8f2yyt000fjzsn512mn4ud	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"123556778","bankAccountName":"tel you","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"you ","leaderLastName":"me","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss2025@","leaderPhone":"0908776554","leaderTitle":"us"}	REG_1759349189762	PENDING	2025-10-01 20:06:29.766	2025-10-01 20:06:29.766
cmg8fleq6000njzsnfihysaq2	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"12345678909","bankAccountName":"me test","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"tu","leaderLastName":"mui","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss2025@","leaderPhone":"09087654328","leaderTitle":"test"}	REG_1759350049996	FAILED	2025-10-01 20:20:49.998	2025-10-01 20:21:11.975
cmg8ft8jm0000jz9antpuqn9l	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"12345555","bankAccountName":"mi kij","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"us","leaderLastName":"you","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss2025@","leaderPhone":"09088776","leaderTitle":"Dr"}	REG_1759350415233	FAILED	2025-10-01 20:26:55.234	2025-10-01 20:27:19.38
cmg8g3k6j000ajz9a168mnk5n	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"122","bankAccountName":"mi ik","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"test","leaderLastName":"test","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss2025@","leaderPhone":"09088888","leaderTitle":"mr"}	REG_1759350896874	FAILED	2025-10-01 20:34:56.875	2025-10-01 20:36:06.287
cmg8gn7060000jzokwpy1mohs	COOPERATIVE	{"cooperativeName":"NOGALSS Cooperative ","cooperativeRegNo":"FCT-2075","bankName":"Access Bank","bankAccountNumber":"123456","bankAccountName":"mi","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"michaelike83@gmail.com","leaderFirstName":"ok","leaderLastName":"ok","leaderEmail":"creativemexy96@gmail.com","leaderPassword":"Nogalss2025@","leaderPhone":"090888","leaderTitle":"mr"}	REG_1759351812916	COMPLETED	2025-10-01 20:50:12.918	2025-10-01 20:50:37.79
cmg9c7bkb0000jzentrnpmoe2	MEMBER	{"firstName":"michael","lastName":"ike","email":"titi@gmail.com","password":"titi123@Q","cooperativeCode":"FCT-2075","nin":"91384417168","dateOfBirth":"2009-10-01","occupation":"banker","address":"4th Floor Jibril Aminu House","city":"amac","lga":"Abuja","state":"Federal Capital Territory","emergencyContact":"emeka","emergencyPhone":"098332288771","savingAmount":"5000","savingFrequency":"DAILY","cooperativeId":"cmg8gnlur0001jzoku128eac1"}	REG_1759404820040	PENDING	2025-10-02 11:33:40.043	2025-10-02 11:33:40.043
cmg9chdlm0001jzenu3yufpm1	MEMBER	{"firstName":"Apex","lastName":"User","email":"john@example.com","password":"123456Qwerty@","cooperativeCode":"FCT-2075","nin":"91384417168","dateOfBirth":"2009-10-01","occupation":"banker","address":"4th Floor Jibril Aminu House","city":"amac","lga":"Abuja","state":"Federal Capital Territory","emergencyContact":"emeka","emergencyPhone":"098332288771","savingAmount":"5000","savingFrequency":"DAILY","cooperativeId":"cmg8gnlur0001jzoku128eac1"}	REG_1759405289240	COMPLETED	2025-10-02 11:41:29.242	2025-10-02 11:42:19.81
cmghu59u500058xkv26g915xd	COOPERATIVE	{"cooperativeName":"CreativemexyCar ","cooperativeRegNo":"FCT-20790","bankName":"Access Bank","bankAccountNumber":"123456","bankAccountName":"Creativemexy Car","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"creativemexy96@gmail.com","leaderFirstName":"TITI","leaderLastName":"LOLA","leaderEmail":"administration@nogalss.com","leaderPassword":"admin123","leaderPhone":"08153034486","leaderTitle":"MRS"}	REG_1759918686988	PENDING	2025-10-08 10:18:06.989	2025-10-08 10:18:06.989
cmgi0dqmt00008xmwz4esp7sj	MEMBER	{"firstName":"Noah","lastName":"smith","email":"mercyzrt@gmail.com","password":"Password!12","cooperativeCode":"FCT-2075","nin":"91384417168","dateOfBirth":"2009-10-07","occupation":"banker","address":"4th Floor Jibril Aminu House","city":"garki","lga":"Abuja","state":"Federal Capital Territory","emergencyContact":"king","emergencyPhone":"098332288771","savingAmount":"12000","savingFrequency":"MONTHLY","cooperativeId":"cmg8gnlur0001jzoku128eac1"}	REG_1759929159701	COMPLETED	2025-10-08 13:12:39.702	2025-10-08 13:27:45.813
cmh06li720008jz8w2t9xm0zy	COOPERATIVE	{"cooperativeName":"NOGALSS TEST 2","cooperativeRegNo":"SUL-90843","bankName":"Fidelity Bank Nigeria","bankAccountNumber":"8098712312","bankAccountName":"NOGALSS TEST 2","address":"8717 W110th St Suite 220","city":"Galadimawa","phone":"08153034486","cooperativeEmail":"info@creativemexy.com.ng","leaderFirstName":"james","leaderLastName":"smith","leaderEmail":"ike@creativemexy.com.ng","leaderPassword":"Creativemexy1@","leaderPhone":"09139278437","leaderTitle":"chief","parentOrganizationId":"cmgqacm7a0003jzwmwp6q48uw"}	REG_1761027990869	PENDING	2025-10-21 06:26:30.879	2025-10-21 06:26:30.879
cmh0con7t0000jz1q4cxcyhkn	COOPERATIVE	{"cooperativeName":"CreativemexyCar ","cooperativeRegNo":"FCT-207523","bankName":"Citibank","bankAccountNumber":"1239087653","bankAccountName":"creativecar","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09071254060","cooperativeEmail":"info@creativemexy.com.ng","leaderFirstName":"test","leaderLastName":"test","leaderEmail":"ike@creativemexy.com","leaderPassword":"Creativemexy2025@","leaderPhone":"07063807477","leaderTitle":"queen","parentOrganizationId":"cmgqacm7a0003jzwmwp6q48uw"}	REG_1761038215045	PENDING	2025-10-21 09:16:55.049	2025-10-21 09:16:55.049
cmh0em9u30000p4vr2eq2wz3p	COOPERATIVE	{"cooperativeName":"NOGALSS TEST 2","cooperativeRegNo":"SUL-90843","bankName":"Access Bank","bankAccountNumber":"1290876542","bankAccountName":"test test","address":"8717 W110th St Suite 220","city":"overland park","phone":"09112922056","cooperativeEmail":"info@creativemexy.com.ng","leaderFirstName":"james","leaderLastName":"smith","leaderEmail":"ike@creativemexy.com.ng","leaderPassword":"Creativemexy2025@","leaderPhone":"09139278437","leaderTitle":"king","parentOrganizationId":"cmgqacm7a0003jzwmwp6q48uw"}	REG_1761041463626	PENDING	2025-10-21 10:11:03.627	2025-10-21 10:11:03.627
cmh0gda5f0000p4bnn8uzcbih	COOPERATIVE	{"cooperativeName":"creativemexy","cooperativeRegNo":"Abj1234","bankName":"Zenith Bank","bankAccountNumber":"0971254390","bankAccountName":"creativemexy96","address":"Test message ","city":"Abuja","phone":"09112922056","cooperativeEmail":"ike@creativemexy.com.ng","leaderFirstName":"Test ","leaderLastName":"Test","leaderEmail":"info@creativemexy.com.ng","leaderPassword":"Creativemexy2025@","leaderPhone":"09139278437","leaderTitle":"King","parentOrganizationId":"cmgqacm7a0003jzwmwp6q48uw"}	REG_1761044403362	PENDING	2025-10-21 11:00:03.363	2025-10-21 11:00:03.363
cmh0gog350001p4bnxv3tz5m7	COOPERATIVE	{"cooperativeName":"NOGALSS TEST 2","cooperativeRegNo":"SUL-90843","bankName":"Access Bank","bankAccountNumber":"0908765897","bankAccountName":"test yest","address":"8717 W110th St Suite 220","city":"overland park","phone":"09139278437","cooperativeEmail":"ike@creativemexy.com.ng","leaderFirstName":"james","leaderLastName":"smith","leaderEmail":"ike@creativemexy.com.ng","leaderPassword":"Creativemexy2025@","leaderPhone":"09112922056","leaderTitle":"chief","parentOrganizationId":"cmgqacm7a0003jzwmwp6q48uw"}	REG_1761044924272	PENDING	2025-10-21 11:08:44.273	2025-10-21 11:08:44.273
cmh0ifw5z0000jzh4bvclztsn	COOPERATIVE	{"cooperativeName":"CreativemexyCar ","cooperativeRegNo":"FCT-207523","bankName":"Access Bank","bankAccountNumber":"1234560966","bankAccountName":"creativemexy Car","address":"4th Floor Jibril Aminu House","city":"amac","phone":"09139278437","cooperativeEmail":"ike@creativemexy.com.ng","leaderFirstName":"test","leaderLastName":"test","leaderEmail":"info@creativemexy.com.ng","leaderPassword":"Creativemexy2025@","leaderPhone":"09112922056","leaderTitle":"king","parentOrganizationId":"cmgqacm7a0003jzwmwp6q48uw"}	REG_1761047884436	COMPLETED	2025-10-21 11:58:04.439	2025-10-21 11:58:50.621
cmh0lq8yj0002p4bnn2cf6k3u	MEMBER	{"firstName":"Mexy","lastName":"Kila","email":"michael.i@bitsynchgroup.com","password":"Kilo1@#u","cooperativeCode":"FCT-2075","nin":"1097662667","dateOfBirth":"1997-10-21","occupation":"Actor","address":"Plot 829","city":"Karu","lga":"Abuja","state":"Federal Capital Territory","phoneNumber":"09032888000","nextOfKinName":"Kila mako","nextOfKinPhone":"09023668558","emergencyContact":"Molly issues ","emergencyPhone":"09072550880","savingAmount":"10000","savingFrequency":"MONTHLY","cooperativeId":"cmg8gnlur0001jzoku128eac1"}	REG_1761053406427	PENDING	2025-10-21 13:30:06.428	2025-10-21 13:30:06.428
cmh0wc7ja0000p4kg21uayadu	MEMBER	{"firstName":"james","lastName":"smith","email":"hello@techshift.buzz","password":"Hello2025@","cooperativeCode":"FCT-207523","nin":"8865017259","dateOfBirth":"2009-09-27","occupation":"Advertising Assistant","address":"8717 W110th St Suite 220","city":"overland park","lga":"Shanga","state":"Kebbi","phoneNumber":"07063807477","nextOfKinName":"james smith","nextOfKinPhone":"08153034486","emergencyContact":"james smith","emergencyPhone":"08153034486","savingAmount":"20000","savingFrequency":"WEEKLY","cooperativeId":"cmh0igt320001jzh4awwhzzvg"}	REG_1761071227173	COMPLETED	2025-10-21 18:27:07.174	2025-10-24 19:00:32.857
cmh93t6hh0005p49lrtn9pocc	COOPERATIVE	{"cooperativeName":"ABC","cooperativeRegNo":"01909029","bankName":"Access Bank","bankAccountNumber":"0909389098","bankAccountName":"ABC","address":"Abuja Nigeria","city":"Garki","phone":"09087654565","cooperativeEmail":"abc@gmail.com","leaderFirstName":"ABC","leaderLastName":"CPC","leaderEmail":"abc@gmail.com","leaderPassword":"abc@gmail.com","leaderPhone":"08090987654","leaderTitle":"Dr","parentOrganizationId":"cmgqacm7a0003jzwmwp6q48uw"}	REG_1761567505684	FAILED	2025-10-27 12:18:25.686	2025-10-27 12:20:49.933
cmh944hn8000bp49la1dwkb8g	COOPERATIVE	{"cooperativeName":"cocoa farmers union","cooperativeRegNo":"0502695695","bankName":"Guaranty Trust Bank","bankAccountNumber":"7063807477","bankAccountName":"Cocoa Famers Union","address":"Cocoa House, Lagos","city":"Ikeja Lagos","phone":"08075654859","cooperativeEmail":"tijanimercy@gmail.com","leaderFirstName":"Peter","leaderLastName":"Bon","leaderEmail":"tijanimercy@gmail.com","leaderPassword":"tijanimercy@8","leaderPhone":"09063807477","leaderTitle":"Dr","parentOrganizationId":"cmgqacm7a0003jzwmwp6q48uw"}	REG_1761568033364	FAILED	2025-10-27 12:27:13.365	2025-10-27 12:27:53.325
\.


--
-- Data for Name: privacy_impact_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.privacy_impact_assessments (id, "activityId", purpose, "legalBasis", "dataCategories", "riskLevel", "mitigationMeasures", "dataMinimization", "purposeLimitation", "storageLimitation", accuracy, security, transparency, "assessmentDate", "assessedBy", "approvedBy") FROM stdin;
\.


--
-- Data for Name: states; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.states (id, name) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, category, key, value, description, "isActive", "updatedAt", "updatedBy") FROM stdin;
cmgfiku250001jzat5b4vrcfb	security	passwordPolicy	Minimum 8 characters, 1 number	\N	t	2025-10-06 23:40:09.087	cmg4e5ohn0000jzejyo2x5llp
cmgfikuia0002jzatw4m0rytc	security	sessionTimeout	30	\N	t	2025-10-06 23:40:09.089	cmg4e5ohn0000jzejyo2x5llp
cmgfikuqm0003jzatf7imk9og	security	twoFA	true	\N	t	2025-10-06 23:40:09.091	cmg4e5ohn0000jzejyo2x5llp
cmg8ht16c0000jznz5a8y3rgh	payment	registration_fee	5000000	Cooperative registration fee in kobo	t	2025-10-08 22:52:12.265	system
cmgilemr80001jzmh8bvdl9hb	payment	cooperative_registration_fee	5000000	Cooperative registration fee in kobo	t	2025-10-08 23:01:13.268	system
cmgilem980000jzmhfknludkz	payment	member_registration_fee	500000	Member registration fee in kobo	t	2025-10-08 23:11:17.743	system
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, "userId", "cooperativeId", "businessId", type, amount, description, reference, status, "isActive", "createdAt", "updatedAt") FROM stdin;
cmg8gnom60009jzokg4diy3qo	cmg8gnnfk0005jzok2j1fqjmp	cmg8gnlur0001jzoku128eac1	\N	FEE	50000.000000000000000000000000000000	Cooperative registration fee payment	REG_1759351812916	SUCCESSFUL	t	2025-10-01 20:50:35.743	2025-10-01 20:50:35.743
cmg9cides0005jzensdw6hlx0	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	\N	FEE	750000.000000000000000000000000000000	Member registration fee payment	REG_1759405289240	SUCCESSFUL	t	2025-10-02 11:42:15.652	2025-10-02 11:42:15.652
cmg9y432r0009jz1dm8655ypc	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	\N	CONTRIBUTION	100000.000000000000000000000000000000	Member contribution payment	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759441580549	SUCCESSFUL	t	2025-10-02 21:47:00.627	2025-10-02 21:47:00.627
cmg9yizob0005jziy1cnbp600	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	\N	CONTRIBUTION	100000.000000000000000000000000000000	Member contribution payment	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759442167840_TXN	SUCCESSFUL	t	2025-10-02 21:58:36.059	2025-10-02 21:58:36.059
cmg9zm5v6000hjziyhlraingu	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	\N	CONTRIBUTION	100000.000000000000000000000000000000	Member contribution payment	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759444015041_TXN	SUCCESSFUL	t	2025-10-02 22:29:03.666	2025-10-02 22:29:03.666
cmga0mq1b000pjziyw2fgz85j	cmg9cicsl0003jzenmhpdjgxf	cmg8gnlur0001jzoku128eac1	\N	CONTRIBUTION	100000.000000000000000000000000000000	Member contribution payment	CONTRIB_cmg9cicsl0003jzenmhpdjgxf_1759445777759_TXN	SUCCESSFUL	t	2025-10-02 22:57:29.422	2025-10-02 22:57:29.422
cmgi0x3dn0003jzctt5rybi9e	cmgi0x2le0001jzct9l9dx8bk	cmg8gnlur0001jzoku128eac1	\N	FEE	517500.000000000000000000000000000000	Member registration fee payment	REG_1759929159701	SUCCESSFUL	t	2025-10-08 13:27:42.683	2025-10-08 13:27:42.683
cmh0igv1k0009jzh45uu1cyje	cmh0igu840005jzh4chqzkqzu	cmh0igt320001jzh4awwhzzvg	\N	FEE	5085000.000000000000000000000000000000	Cooperative registration fee payment	REG_1761047884436	SUCCESSFUL	t	2025-10-21 11:58:49.64	2025-10-21 11:58:49.64
cmh57uqf60003p49l1bhp6r84	cmh57uq6g0001p49lfyr2rrib	cmh0igt320001jzh4awwhzzvg	\N	FEE	500000.000000000000000000000000000000	Member registration fee payment	REG_1761071227173	SUCCESSFUL	t	2025-10-24 19:00:31.938	2025-10-24 19:00:31.938
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, "userId", "sessionId", "ipAddress", "userAgent", "isActive", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, "firstName", "lastName", "phoneNumber", "dateOfBirth", address, "profileImage", role, "isActive", "isVerified", "createdAt", "updatedAt", "cooperativeId", "businessId", title, "twoFactorEnabled", "twoFactorSecret", "nextOfKinName", "nextOfKinPhone", nin) FROM stdin;
cmg5mw1ie0000jz018d2ww3kk	apexuser@nogalss.org	$2b$12$hY4OPMDMf3.m8CDAjWVMcuGf23qaZJ.06GFlmex0kVx68F0xp6qgu	Apex	User	+2349087654321	2025-09-13 00:00:00	admin@nogalss.com	\N	APEX	t	t	2025-09-29 21:21:44.87	2025-09-29 21:23:01.062	\N	\N	\N	f	\N	\N	\N	\N
cmg8gnmnn0003jzok1yh1e8e7	michaelike83@gmail.com	$2b$12$GJOAe9i0Ffwddzkq3v9EKOxxhDbjI6ZhHdsBrmMosK5BaArkgy3hW	NOGALSS Cooperative 	Organization	09071254060	\N	\N	\N	COOPERATIVE	t	t	2025-10-01 20:50:33.194	2025-10-02 23:21:04.026	cmg8gnlur0001jzoku128eac1	\N	\N	f	\N	\N	\N	\N
cmg73lnie0001jzj9ncmngowt	finance@nogalss.com	$2b$12$hmjvIrGUvIFZTd.9FW5cQelJxWkUxOXURWDOhTPSnCTfLs97Duh12	Finance	User	09087654321	\N	4th Floor Jibril Aminu House	\N	FINANCE	t	t	2025-09-30 21:57:19.815	2025-09-30 22:05:41.671	\N	\N	\N	f	\N	\N	\N	\N
cmg8gnnfk0005jzok2j1fqjmp	creativemexy96@gmail.com	$2b$12$GJOAe9i0Ffwddzkq3v9EKOxxhDbjI6ZhHdsBrmMosK5BaArkgy3hW	ok	ok	090888	\N	\N	\N	LEADER	t	t	2025-10-01 20:50:34.208	2025-10-02 23:21:10.172	cmg8gnlur0001jzoku128eac1	\N	\N	f	\N	\N	\N	\N
cmg9cicsl0003jzenmhpdjgxf	john@example.com	$2b$12$98fSB7WyXSeSIX7jucAZO.Cw3xMQqpvrVzkV8wgMRq4p4CtKhUzOm	Apex	User	098332288771	2009-10-01 00:00:00	4th Floor Jibril Aminu House	\N	MEMBER	t	t	2025-10-02 11:42:14.852	2025-10-02 23:21:17.375	cmg8gnlur0001jzoku128eac1	\N	\N	f	\N	\N	\N	\N
cmg7yt9cw0000jzwofr2m7n7i	nogalss@nogalss.com	$2b$12$PksBPwcSPZChxBCOLQ/uYeHpgSPev8t7oA2ijLAzbUs7Dh7Vb/cMy	Noah	Emmanuel	09087654321	\N	4th Floor Jibril Aminu House	\N	NOGALSS_FUNDS	t	t	2025-10-01 12:31:02.816	2025-10-01 12:31:45.4	\N	\N	\N	f	\N	\N	\N	\N
cmg7x5cve0002jz0d4zfivqbt	apexfund@nogalss.com	$2b$10$7oN8fg7OgL12GfSYbTY3KuKv7qTVaUT8d2QWh5EuwtYNhxFzrePcK	Apex	Fund	09087654321	\N	4th Floor Jibril Aminu House	\N	APEX_FUNDS	t	t	2025-10-01 11:44:28.01	2025-10-01 12:32:03.643	\N	\N	\N	f	\N	\N	\N	\N
cmg4e5ohn0000jzejyo2x5llp	admin@nogalss.com	$2b$12$zswQm4zbl5Sab2n9hxk17eT5spJ9Y2e1SOMHyU7JI8Uv4VBGCkEea	Super	Admin	08000000000	\N	Nogalss Headquarters	\N	SUPER_ADMIN	t	t	2025-09-29 00:29:31.835	2025-10-07 00:48:44.572	\N	\N	\N	t	GRPRWND4B4RSKU32	\N	\N	\N
cmgqaclq00001jzwmnyc5r4oe	mexereum@gmail.com	$2b$12$0ROrhj9jOUdVyqe3o9qsGuDBXAG.mocTHdLZvG5g.LxR779upzi7K	mexy	Organization	8153034486	\N	\N	\N	PARENT_ORGANIZATION	t	t	2025-10-14 08:13:52.248	2025-10-15 13:18:22.554	\N	\N	\N	f	\N	\N	\N	\N
cmgi0x2le0001jzct9l9dx8bk	mercyzrt@gmail.com	$2b$12$VSFkrsraEGV7BSKRd9kyG.mgv41o1DiU5dBkieBsJedYj.Q7c6EFe	Noah	smith	098332288771	2009-10-07 00:00:00	4th Floor Jibril Aminu House	\N	MEMBER	t	t	2025-10-08 13:27:41.657	2025-10-16 17:40:51.675	cmg8gnlur0001jzoku128eac1	\N	\N	f	\N	\N	\N	\N
cmh0igtn30003jzh4xspxlws7	ike@creativemexy.com.ng	$2b$12$i5vDay.hcgbTQwyD0BIQmOuScGyxu..6eyZZBLUlDp7n95/X2UBwm	CreativemexyCar 	Organization	09139278437	\N	\N	\N	COOPERATIVE	t	f	2025-10-21 11:58:47.822	2025-10-21 11:58:47.822	cmh0igt320001jzh4awwhzzvg	\N	\N	f	\N	\N	\N	\N
cmh0igu840005jzh4chqzkqzu	info@creativemexy.com.ng	$2b$12$i5vDay.hcgbTQwyD0BIQmOuScGyxu..6eyZZBLUlDp7n95/X2UBwm	test	test	09112922056	\N	\N	\N	LEADER	t	f	2025-10-21 11:58:48.58	2025-10-21 11:58:48.58	cmh0igt320001jzh4awwhzzvg	\N	\N	f	\N	\N	\N	\N
cmh57uq6g0001p49lfyr2rrib	hello@techshift.buzz	$2b$12$Bvo3veXZm.nGVj.e/oy0HuMkrxdhZZrh/JEKQ5wRApERAZaGQW7v2	james	smith	07063807477	2009-09-27 00:00:00	8717 W110th St Suite 220	\N	MEMBER	t	f	2025-10-24 19:00:31.624	2025-10-24 19:00:31.624	cmh0igt320001jzh4awwhzzvg	\N	\N	f	\N	james smith	08153034486	\N
\.


--
-- Data for Name: virtual_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.virtual_accounts (id, "userId", "accountType", "accountName", "accountNumber", "bankName", "bankCode", "customerCode", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.withdrawals (id, "userId", amount, reason, status, "requestedAt", "processedAt", "processedBy", notes, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: EmergencyAlert EmergencyAlert_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmergencyAlert"
    ADD CONSTRAINT "EmergencyAlert_pkey" PRIMARY KEY (id);


--
-- Name: Partner Partner_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Partner"
    ADD CONSTRAINT "Partner_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: apex apex_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.apex
    ADD CONSTRAINT apex_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: banks banks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_pkey PRIMARY KEY (id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: charge_records charge_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charge_records
    ADD CONSTRAINT charge_records_pkey PRIMARY KEY (id);


--
-- Name: consent_records consent_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consent_records
    ADD CONSTRAINT consent_records_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: contributions contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);


--
-- Name: cooperatives cooperatives_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperatives
    ADD CONSTRAINT cooperatives_pkey PRIMARY KEY (id);


--
-- Name: data_breaches data_breaches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_breaches
    ADD CONSTRAINT data_breaches_pkey PRIMARY KEY (id);


--
-- Name: data_processing_activities data_processing_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_processing_activities
    ADD CONSTRAINT data_processing_activities_pkey PRIMARY KEY (id);


--
-- Name: data_retention_policies data_retention_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_retention_policies
    ADD CONSTRAINT data_retention_policies_pkey PRIMARY KEY (id);


--
-- Name: data_subject_requests data_subject_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_subject_requests
    ADD CONSTRAINT data_subject_requests_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: investments investments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT investments_pkey PRIMARY KEY (id);


--
-- Name: leaders leaders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaders
    ADD CONSTRAINT leaders_pkey PRIMARY KEY (id);


--
-- Name: lgas lgas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lgas
    ADD CONSTRAINT lgas_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: occupations occupations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.occupations
    ADD CONSTRAINT occupations_pkey PRIMARY KEY (id);


--
-- Name: parent_organizations parent_organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_organizations
    ADD CONSTRAINT parent_organizations_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pending_contributions pending_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_contributions
    ADD CONSTRAINT pending_contributions_pkey PRIMARY KEY (id);


--
-- Name: pending_registrations pending_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_registrations
    ADD CONSTRAINT pending_registrations_pkey PRIMARY KEY (id);


--
-- Name: privacy_impact_assessments privacy_impact_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.privacy_impact_assessments
    ADD CONSTRAINT privacy_impact_assessments_pkey PRIMARY KEY (id);


--
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: virtual_accounts virtual_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.virtual_accounts
    ADD CONSTRAINT virtual_accounts_pkey PRIMARY KEY (id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: Setting_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Setting_key_key" ON public."Setting" USING btree (key);


--
-- Name: apex_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "apex_userId_key" ON public.apex USING btree ("userId");


--
-- Name: banks_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX banks_name_key ON public.banks USING btree (name);


--
-- Name: businesses_registrationNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "businesses_registrationNumber_key" ON public.businesses USING btree ("registrationNumber");


--
-- Name: cooperatives_registrationNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "cooperatives_registrationNumber_key" ON public.cooperatives USING btree ("registrationNumber");


--
-- Name: leaders_cooperativeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "leaders_cooperativeId_key" ON public.leaders USING btree ("cooperativeId");


--
-- Name: leaders_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "leaders_userId_key" ON public.leaders USING btree ("userId");


--
-- Name: occupations_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX occupations_name_key ON public.occupations USING btree (name);


--
-- Name: parent_organizations_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "parent_organizations_userId_key" ON public.parent_organizations USING btree ("userId");


--
-- Name: payments_paystackReference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payments_paystackReference_key" ON public.payments USING btree ("paystackReference");


--
-- Name: payments_transactionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "payments_transactionId_key" ON public.payments USING btree ("transactionId");


--
-- Name: pending_contributions_reference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pending_contributions_reference_key ON public.pending_contributions USING btree (reference);


--
-- Name: pending_registrations_reference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX pending_registrations_reference_key ON public.pending_registrations USING btree (reference);


--
-- Name: states_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX states_name_key ON public.states USING btree (name);


--
-- Name: system_settings_category_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_settings_category_key_key ON public.system_settings USING btree (category, key);


--
-- Name: transactions_reference_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX transactions_reference_key ON public.transactions USING btree (reference);


--
-- Name: user_sessions_sessionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_sessions_sessionId_key" ON public.user_sessions USING btree ("sessionId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_nin_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_nin_key ON public.users USING btree (nin);


--
-- Name: virtual_accounts_customerCode_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "virtual_accounts_customerCode_key" ON public.virtual_accounts USING btree ("customerCode");


--
-- Name: virtual_accounts_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "virtual_accounts_userId_key" ON public.virtual_accounts USING btree ("userId");


--
-- Name: apex apex_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.apex
    ADD CONSTRAINT "apex_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_dataProcessingActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_dataProcessingActivityId_fkey" FOREIGN KEY ("dataProcessingActivityId") REFERENCES public.data_processing_activities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: charge_records charge_records_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charge_records
    ADD CONSTRAINT "charge_records_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: charge_records charge_records_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charge_records
    ADD CONSTRAINT "charge_records_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: charge_records charge_records_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.charge_records
    ADD CONSTRAINT "charge_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: consent_records consent_records_dataProcessingActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consent_records
    ADD CONSTRAINT "consent_records_dataProcessingActivityId_fkey" FOREIGN KEY ("dataProcessingActivityId") REFERENCES public.data_processing_activities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contributions contributions_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT "contributions_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contributions contributions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT "contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cooperatives cooperatives_bankId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperatives
    ADD CONSTRAINT "cooperatives_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES public.banks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cooperatives cooperatives_lgaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperatives
    ADD CONSTRAINT "cooperatives_lgaId_fkey" FOREIGN KEY ("lgaId") REFERENCES public.lgas(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cooperatives cooperatives_parentOrganizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperatives
    ADD CONSTRAINT "cooperatives_parentOrganizationId_fkey" FOREIGN KEY ("parentOrganizationId") REFERENCES public.parent_organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cooperatives cooperatives_stateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cooperatives
    ADD CONSTRAINT "cooperatives_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES public.states(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: data_breaches data_breaches_dataProcessingActivityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_breaches
    ADD CONSTRAINT "data_breaches_dataProcessingActivityId_fkey" FOREIGN KEY ("dataProcessingActivityId") REFERENCES public.data_processing_activities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: events events_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT "events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: expenses expenses_approvedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: expenses expenses_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT "expenses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: investments investments_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT "investments_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: investments investments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT "investments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leaders leaders_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaders
    ADD CONSTRAINT "leaders_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: leaders leaders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaders
    ADD CONSTRAINT "leaders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lgas lgas_stateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lgas
    ADD CONSTRAINT "lgas_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES public.states(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: loans loans_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT "loans_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: loans loans_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT "loans_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: parent_organizations parent_organizations_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_organizations
    ADD CONSTRAINT "parent_organizations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: parent_organizations parent_organizations_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_organizations
    ADD CONSTRAINT "parent_organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.parent_organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: parent_organizations parent_organizations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_organizations
    ADD CONSTRAINT "parent_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public.transactions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_contributions pending_contributions_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_contributions
    ADD CONSTRAINT "pending_contributions_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pending_contributions pending_contributions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_contributions
    ADD CONSTRAINT "pending_contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions transactions_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: transactions transactions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_businessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_cooperativeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES public.cooperatives(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: virtual_accounts virtual_accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.virtual_accounts
    ADD CONSTRAINT "virtual_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: withdrawals withdrawals_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT "withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict qejhMjnrwVXeZCeQ1vWhCcLrGncgI5a3GOohxi8Yt5rGvvux5kwxssOVfC8GYLM

