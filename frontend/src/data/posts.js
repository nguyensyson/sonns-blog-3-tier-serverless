// Accent color per cover index: 0 = green, 1 = gold.
export const ACCENTS = ['#34d399', '#e8b54a'];

// `category` distinguishes public blog posts ('blog') from private journal
// entries ('journal') within the same posts table.
export const INITIAL_POSTS = [
  {
    id: 1,
    category: 'blog',
    title: 'Thiết kế hạ tầng AWS chịu tải cao với Auto Scaling',
    tag: 'AWS',
    excerpt:
      'Cách mình cấu hình Auto Scaling Group, Load Balancer và CloudWatch để hệ thống tự co giãn theo lưu lượng thực tế.',
    date: '02/06/2026',
    readTime: '6 phút đọc',
    coverIndex: 0,
    content:
      '<p>Khi lưu lượng truy cập tăng đột biến, việc scale thủ công gần như không thể theo kịp. Mình đã chuyển toàn bộ backend sang chạy trên Auto Scaling Group đứng sau Application Load Balancer.</p><p>Chìa khóa là chọn đúng chỉ số CloudWatch để scale — CPU trung bình không phải lúc nào cũng phản ánh đúng tải, mình dùng thêm request count per target.</p><p>Kết quả: hệ thống chịu được gấp 4 lần lưu lượng bình thường trong các đợt cao điểm mà không cần can thiệp thủ công.</p>',
    images: {},
  },
  {
    id: 2,
    category: 'blog',
    title: 'CI/CD Pipeline với Jenkins và Docker: Từ code đến production',
    tag: 'CI/CD',
    excerpt:
      'Xây dựng pipeline tự động build, test và deploy container lên môi trường staging/production chỉ trong vài phút.',
    date: '18/05/2026',
    readTime: '5 phút đọc',
    coverIndex: 1,
    content:
      '<p>Pipeline gồm 4 bước chính: build image, chạy unit test trong container, push lên registry riêng, và rollout lên Kubernetes bằng rolling update.</p><p>Một điểm quan trọng là tách biệt Jenkinsfile theo môi trường để tránh deploy nhầm cấu hình production vào staging.</p><p>Sau khi áp dụng, thời gian từ commit đến production giảm từ 45 phút xuống còn dưới 8 phút.</p>',
    images: {},
  },
  {
    id: 3,
    category: 'blog',
    title: 'Kubernetes cơ bản: Triển khai ứng dụng Java Spring Boot',
    tag: 'Kubernetes',
    excerpt:
      'Từng bước đóng gói, viết manifest và triển khai một service Spring Boot lên cluster Kubernetes.',
    date: '30/04/2026',
    readTime: '7 phút đọc',
    coverIndex: 0,
    content:
      '<p>Spring Boot đóng gói thành container khá đơn giản, nhưng để chạy tốt trên Kubernetes cần quan tâm đến readiness/liveness probe.</p><p>Mình cấu hình resource requests/limits sát với mức tiêu thụ thực tế đo được từ môi trường staging để tránh OOMKilled.</p><p>ConfigMap và Secret giúp tách cấu hình khỏi image, cho phép cùng một image chạy ở nhiều môi trường khác nhau.</p>',
    images: {},
  },
  {
    id: 4,
    category: 'blog',
    title: 'Terraform: Quản lý hạ tầng dưới dạng code',
    tag: 'DevOps',
    excerpt:
      'Áp dụng Infrastructure as Code giúp đội ngũ review hạ tầng như review code, giảm sai sót khi thay đổi thủ công.',
    date: '12/04/2026',
    readTime: '4 phút đọc',
    coverIndex: 1,
    content:
      '<p>Trước đây mọi thay đổi hạ tầng đều làm tay trên console AWS, rất khó audit và dễ gây lệch cấu hình giữa các môi trường.</p><p>Chuyển sang Terraform, mọi thay đổi đều đi qua pull request, có plan rõ ràng trước khi apply.</p><p>Module hóa theo từng thành phần (VPC, EKS, RDS...) giúp tái sử dụng cấu hình cho nhiều dự án.</p>',
    images: {},
  },
  {
    id: 5,
    category: 'blog',
    title: 'Bảo mật hạ tầng Cloud: Những nguyên tắc cơ bản',
    tag: 'Cloud Security',
    excerpt:
      'Một vài nguyên tắc mình luôn áp dụng khi thiết kế hạ tầng: least privilege, mã hóa dữ liệu, và giám sát liên tục.',
    date: '25/03/2026',
    readTime: '5 phút đọc',
    coverIndex: 0,
    content:
      '<p>Nguyên tắc least privilege là nền tảng — mỗi service chỉ nên có đúng quyền cần thiết, không hơn.</p><p>Mã hóa dữ liệu cả khi lưu trữ (at rest) lẫn khi truyền tải (in transit) nên là mặc định, không phải tùy chọn.</p><p>Giám sát và cảnh báo bất thường theo thời gian thực giúp phát hiện sự cố trước khi nó trở thành thảm họa.</p>',
    images: {},
  },
  {
    id: 6,
    category: 'blog',
    title: 'Giám sát hệ thống với Prometheus và Grafana',
    tag: 'DevOps',
    excerpt:
      'Xây dựng bộ dashboard theo dõi latency, error rate và tài nguyên hệ thống cho toàn bộ các service backend.',
    date: '08/03/2026',
    readTime: '6 phút đọc',
    coverIndex: 1,
    content:
      '<p>Prometheus scrape metrics từ mỗi service qua endpoint /metrics, còn Grafana lo phần trực quan hóa.</p><p>Mình định nghĩa alerting rule cho các chỉ số quan trọng nhất: error rate &gt; 1%, p95 latency vượt ngưỡng, và dung lượng đĩa gần đầy.</p><p>Dashboard tổng quan giúp cả đội nhìn thấy sức khỏe hệ thống chỉ trong một màn hình duy nhất.</p>',
    images: {},
  },
];
