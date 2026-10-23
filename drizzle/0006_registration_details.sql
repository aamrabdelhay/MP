ALTER TABLE "registration_requests" ADD COLUMN "building_number" varchar(30) DEFAULT '' NOT NULL;
ALTER TABLE "registration_requests" ADD COLUMN "governorate" varchar(40) DEFAULT '' NOT NULL;
ALTER TABLE "registration_requests" ADD COLUMN "study_year" varchar(40) DEFAULT '' NOT NULL;
