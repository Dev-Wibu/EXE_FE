/**
 * Company Detail Page
 * Public page showing company details and job listings
 * Route: /enterprise/company/:id
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { motion } from "framer-motion";

import { Footer } from "@/components/layouts";
import { HomepageHeader } from "@/components/homepage-redesign";
import { Spinner } from "@/components/ui/spinner";
import { companyManager, type Company, type JobDescription } from "@/services/company.manager";

import { CompanyHeroSection } from "./components/CompanyHeroSection";
import { CompanyInfoSection } from "./components/CompanyInfoSection";
import { JobListingsSection } from "./components/JobListingsSection";

const MOCK_COMPANY: Company = {
  id: 1,
  name: "TechNova Solutions",
  logoUrl: undefined,
  bannerUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80",
  description:
    "Tiên phong trong việc kiến tạo các giải pháp trí tuệ nhân tạo và hệ thống Backend quy mô lớn. Chúng tôi xây dựng tương lai số với độ chính xác tuyệt đối.",
  industry: "Technology & AI",
  website: "https://technova.example.com",
  location: "TP. Hồ Chí Minh",
  size: "200-500 nhân viên",
  foundedYear: 2018,
  benefits: [
    "Bảo hiểm sức khỏe cao cấp",
    "Môi trường làm việc hiện đại",
    "Lộ trình thăng tiến rõ ràng",
    "Đào tạo và phát triển kỹ năng",
    "Công việc linh hoạt (Hybrid)",
    "Team building hàng quý",
  ],
  culture:
    "Chúng tôi tin rằng sự sáng tạo và hợp tác là chìa khóa để tạo ra những sản phẩm xuất sắc. Mỗi thành viên đều có cơ hội đóng góp ý tưởng và phát triển bản thân.",
  stats: {
    totalEmployees: 350,
    openPositions: 12,
    interviewsPerMonth: 45,
    hiringRate: 78,
  },
  status: "ACTIVE",
};

const MOCK_JOBS: JobDescription[] = [
  {
    id: 1,
    title: "Thực tập sinh Backend (Go/Python)",
    description:
      "Tham gia phát triển các hệ thống microservices quy mô lớn, làm việc với đội ngũ kỹ sư giàu kinh nghiệm.",
    requirements:
      "- Sinh viên năm 3-4 hoặc mới tốt nghiệp\n- Kiến thức cơ bản về Go hoặc Python\n- Hiểu biết về RESTful API\n- Khả năng đọc hiểu tiếng Anh",
    benefits:
      "- Lương: 5.000.000 - 8.000.000 VND\n- Thực tập có lương\n- Đào tạo chuyên sâu\n- Cơ hội trở thành nhân viên chính thức",
    level: "INTERN",
    salaryMin: 5000000,
    salaryMax: 8000000,
    appliedCount: 28,
    currency: "VND",
    status: "OPEN",
    location: "TP. Hồ Chí Minh",
    workType: "Full-time/Hybrid",
    skills: ["Go Lang", "Python", "PostgreSQL", "Docker", "Redis"],
    companyId: 1,
    companyName: "TechNova Solutions",
  },
  {
    id: 2,
    title: "Frontend Developer (ReactJS)",
    description:
      "Xây dựng giao diện người dùng hiện đại, responsive và trải nghiệm người dùng mượt mà.",
    requirements:
      "- 1-2 năm kinh nghiệm với React\n- Thành thạo TypeScript\n- Kiến thức về CSS/Tailwind\n- Hiểu biết về state management",
    benefits:
      "- Lương: 15.000.000 - 25.000.000 VND\n- Thưởng hiệu suất\n- Bảo hiểm cao cấp\n- Đào tạo công nghệ mới",
    level: "JUNIOR",
    salaryMin: 15000000,
    salaryMax: 25000000,
    appliedCount: 42,
    currency: "VND",
    status: "OPEN",
    location: "Hà Nội",
    workType: "Full-time",
    skills: ["ReactJS", "TypeScript", "TailwindCSS", "Next.js", "Redux"],
    companyId: 1,
    companyName: "TechNova Solutions",
  },
  {
    id: 3,
    title: "AI Engineer (Computer Vision)",
    description:
      "Phát triển và triển khai các mô hình AI cho ứng dụng Computer Vision trong sản phẩm thực tế.",
    requirements:
      "- 2-4 năm kinh nghiệm trong AI/ML\n- Thành thạo PyTorch hoặc TensorFlow\n- Kinh nghiệm với OpenCV\n- Hiểu biết về model deployment",
    benefits:
      "- Lương: 25.000.000 - 45.000.000 VND\n- Thưởng dự án\n- Phần mềm và phần cứng cao cấp\n- Cơ hội nghiên cứu",
    level: "MIDDLE",
    salaryMin: 25000000,
    salaryMax: 45000000,
    appliedCount: 15,
    currency: "VND",
    status: "OPEN",
    location: "Từ xa (Remote)",
    workType: "Full-time",
    skills: ["PyTorch", "OpenCV", "YOLOv8", "NVIDIA TensorRT", "MLOps"],
    companyId: 1,
    companyName: "TechNova Solutions",
  },
  {
    id: 4,
    title: "Senior Backend Engineer (Go)",
    description: "Thiết kế và phát triển các hệ thống backend có tính sẵn sàng cao.",
    requirements:
      "- 4+ năm kinh nghiệm với Go\n- Kinh nghiệm với microservices\n- Hiểu biết về Kubernetes\n- Khả năng thiết kế hệ thống",
    benefits:
      "- Lương: 40.000.000 - 70.000.000 VND\n- Thưởng hiệu suất cao\n- Cổ phần công ty\n- Lịch làm việc linh hoạt",
    level: "SENIOR",
    salaryMin: 40000000,
    salaryMax: 70000000,
    appliedCount: 8,
    currency: "VND",
    status: "OPEN",
    location: "TP. Hồ Chí Minh",
    workType: "Full-time/Hybrid",
    skills: ["Go Lang", "gRPC", "Kubernetes", "PostgreSQL", "Kafka"],
    companyId: 1,
    companyName: "TechNova Solutions",
  },
];

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("ID công ty không hợp lệ");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch from API
        const [companyResult, jobsResult] = await Promise.all([
          companyManager.getById(id),
          companyManager.getJobs(id),
        ]);

        if (companyResult.success && companyResult.data) {
          setCompany(companyResult.data);
        } else {
          // Fall back to mock data if API fails
          console.log("[CompanyDetailPage] Using mock company data");
          setCompany({ ...MOCK_COMPANY, id: Number(id) || MOCK_COMPANY.id });
        }

        if (jobsResult.success && jobsResult.data) {
          const jobList = Array.isArray(jobsResult.data)
            ? jobsResult.data
            : jobsResult.data.data || [];
          setJobs(jobList);
        } else {
          // Fall back to mock jobs
          console.log("[CompanyDetailPage] Using mock job data");
          setJobs(MOCK_JOBS);
        }
      } catch (err) {
        console.error("[CompanyDetailPage] Fetch error:", err);
        // Fall back to mock data on error
        setCompany({ ...MOCK_COMPANY, id: Number(id) || MOCK_COMPANY.id });
        setJobs(MOCK_JOBS);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HomepageHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Đang tải thông tin công ty...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HomepageHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              Không tìm thấy công ty
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {error || "Công ty bạn đang tìm kiếm không tồn tại."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <HomepageHeader />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}>
        {/* Hero Section - Banner + Company Info */}
        <CompanyHeroSection company={company} />

        {/* Company Information - About, Culture, Benefits, Stats */}
        <CompanyInfoSection company={company} />

        {/* Job Listings Section - Search, Filter, Job Cards */}
        <JobListingsSection jobs={jobs} companyName={company.name || "Công ty"} />
      </motion.main>

      <Footer />
    </div>
  );
}
