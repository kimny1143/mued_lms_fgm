'use client';

import { ChevronDownIcon, ChevronRightIcon, ImageIcon } from "lucide-react";
import React from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "../../components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import Image from "next/image";
import LogoImage from '../../../public/logo.png';
import { useRouter } from "next/navigation";

export const Container = (): JSX.Element => {
  const router = useRouter();

  const handleSignUp = () => {
    router.push('/register');
  };

  return (
    <section className="flex items-start px-4 sm:px-0 py-12 relative self-stretch w-full flex-[0_0_auto] z-[2]">
      <div className="flex flex-col items-start relative flex-1 grow">
        {/* Hero Section */}
        <div className="relative self-stretch w-full z-[3] bg-white overflow-hidden">
          <div className="mued-container flex-col w-full">
            <div className="flex flex-col items-center gap-12 sm:gap-24 relative self-stretch w-full flex-[0_0_auto]">
              <h1 
                className="relative self-stretch mt-[-1.00px] mued-hero-text-large"
              >
                <span className="block">Learn Anytime, Anywhere</span>
                <span className="block">with <span className="mued-text-bold">MUED</span></span>
              </h1>

              <button 
                className="mued-btn w-full sm:w-auto"
                onClick={handleSignUp}
              >
                <span className="font-shantell font-medium text-white text-xl leading-7">
                  Get Started
                </span>
              </button>
            </div>

            <div className="relative self-stretch w-full h-[400px] sm:h-[865px] overflow-hidden">
              <div className="mued-phone-mockup">
                <div className="absolute w-[70%] h-[42px] top-[378px] left-[15%] bg-[#00000033] rounded opacity-50" />
                <div className="absolute w-[60%] h-[42px] top-[444px] left-[20%] bg-[#00000033] rounded opacity-50" />

                <button 
                  className="mued-btn flex w-[85%] items-center justify-center gap-2 absolute top-[800px] left-[7.5%]"
                  onClick={handleSignUp}
                >
                  <span className="font-shantell font-medium text-white text-xl leading-7">
                    Join Now
                  </span>
                </button>

                <div className="h-[72px] gap-[9px] absolute top-[229px] left-[50%] transform -translate-x-1/2 inline-flex items-center">
                  <Image
                    className="relative w-[63px] h-[63px] object-contain"
                    alt="Logomark"
                    src={LogoImage}
                    width={63}
                    height={63}
                    priority
                  />
                  <div className="mued-logo-text relative w-fit whitespace-nowrap">
                    <span className="font-shantell font-bold">M</span>
                    <span className="font-shantell font-bold">U</span>
                    <span className="font-shantell font-bold">E</span>
                    <span className="font-shantell font-bold">D</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="flex flex-col items-start justify-center gap-12 px-4 sm:px-0 py-12 relative self-stretch w-full flex-[0_0_auto] z-[2] bg-white">
          <h2 className="relative self-stretch mt-[-2.00px] font-shantell font-medium text-[#000000cc] text-4xl sm:text-5xl text-center tracking-[0] leading-tight sm:leading-[1.2]">
            Why Choose MUED?
          </h2>

          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative self-stretch w-full">
              {/* Feature cards */}
              <div className="mued-card flex flex-col h-[480px] items-end pt-8 pb-0 px-0 relative">
                {/* Card content */}
              </div>
              {/* Second feature card */}
              <div className="mued-card flex flex-col h-[480px] items-end pt-8 pb-0 px-0 relative">
                {/* Card content */}
              </div>
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section className="flex flex-col items-start pt-0 pb-12 px-4 sm:px-0 relative self-stretch w-full flex-[0_0_auto] z-[1] bg-white">
          <div className="flex flex-col items-start justify-center gap-6 px-0 py-6 relative self-stretch w-full flex-[0_0_auto] z-[2] bg-white">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 relative self-stretch w-full flex-[0_0_auto] bg-transparent">
              <div className="flex flex-wrap items-start gap-3 relative flex-[0_0_auto]">
                <Select>
                  <SelectTrigger className="inline-flex items-center justify-center gap-2 pl-4 pr-3 py-2 relative flex-[0_0_auto] bg-white mued-border text-base">
                    <SelectValue placeholder="Category" />
                    <ChevronDownIcon className="w-5 h-5" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all" className="text-base">All Categories</SelectItem>
                      <SelectItem value="programming" className="text-base">Programming</SelectItem>
                      <SelectItem value="design" className="text-base">Design</SelectItem>
                      <SelectItem value="business" className="text-base">Business</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="inline-flex items-center justify-center gap-2 pl-4 pr-3 py-2 relative flex-[0_0_auto] bg-white mued-border text-base">
                    <SelectValue placeholder="Level" />
                    <ChevronDownIcon className="w-5 h-5" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all" className="text-base">All Levels</SelectItem>
                      <SelectItem value="beginner" className="text-base">Beginner</SelectItem>
                      <SelectItem value="intermediate" className="text-base">Intermediate</SelectItem>
                      <SelectItem value="advanced" className="text-base">Advanced</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-fit font-jp text-[#00000066] text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                9 items
              </div>
            </header>
          </div>

          <div className="flex flex-col items-start gap-12 relative self-stretch w-full flex-[0_0_auto] z-[1]">
            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative self-stretch w-full">
              {/* Plan cards */}
            </div>
          </div>

          {/* Pagination */}
          <Pagination className="flex items-start justify-center sm:justify-end pt-16 pb-0 px-0 relative self-stretch w-full flex-[0_0_auto] z-0">
            <PaginationContent className="flex-wrap justify-center">
              {/* Pagination content */}
            </PaginationContent>
          </Pagination>
        </section>

        {/* CTA Section */}
        <section className="flex flex-col items-start gap-2 px-4 sm:px-0 py-6 relative self-stretch w-full flex-[0_0_auto] z-0 bg-white">
          <div className="relative self-stretch w-full h-[400px] sm:h-[625px] border-[#000000cc] bg-[#eeeeee] rounded-lg overflow-hidden mued-border">
            <div className="relative w-full h-full">
              <div className="absolute w-full h-full top-0 left-0 bg-[#00000080] opacity-20" />
              <div className="flex flex-col w-full max-w-[900px] mx-auto items-center gap-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 sm:px-0">
                <h2 className="relative self-stretch mt-[-1.00px] font-shantell font-normal text-[#000000cc] text-3xl sm:text-5xl text-center tracking-[0] leading-tight sm:leading-[1.2]">
                  Ready to Start Your Learning Journey?
                </h2>
                <button 
                  className="mued-btn-outline w-full sm:w-auto"
                  onClick={handleSignUp}
                >
                  <span className="font-jp font-medium text-[#000000cc] text-xl leading-7 whitespace-nowrap">
                    今すぐはじめる
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};