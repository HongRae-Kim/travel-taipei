variable "aws_region" {
  description = "AWS 리전"
  default     = "ap-northeast-2"
}

variable "project_name" {
  description = "프로젝트 이름 (리소스 태그 prefix)"
  default     = "travel-taipei"
}

variable "instance_type" {
  description = "EC2 인스턴스 타입"
  default     = "t2.micro"
}

variable "key_name" {
  description = "EC2 SSH Key Pair 이름"
}

variable "my_ip" {
  description = "SSH 허용할 내 IP (예: 1.2.3.4/32)"
}

variable "db_password" {
  description = "RDS PostgreSQL 비밀번호"
  sensitive   = true
}

# ── 앱 환경변수 ────────────────────────────────────────────

variable "exchange_api_key" {
  description = "한국수출입은행 환율 API 키"
  sensitive   = true
}

variable "openweather_api_key" {
  description = "OpenWeatherMap API 키"
  sensitive   = true
}

variable "google_maps_api_key" {
  description = "Google Maps/Places API 키"
  sensitive   = true
}

variable "allowed_origins" {
  description = "CORS 허용 출처 (Vercel 도메인, 예: https://travel-taipei.vercel.app)"
}
