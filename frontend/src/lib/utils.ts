import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined) {
  // Kiểm tra giá trị đầu vào
  if (!date) return 'Không có ngày';
  
  try {
    const dateObj = new Date(date);
    
    // Kiểm tra date có hợp lệ không
    if (isNaN(dateObj.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Ngày không hợp lệ';
  }
}

export function formatRelativeTime(date: string | Date | null | undefined) {
  // Kiểm tra giá trị đầu vào
  if (!date) return 'Không có ngày';
  
  try {
    const now = new Date();
    const targetDate = new Date(date);
    
    // Kiểm tra date có hợp lệ không
    if (isNaN(targetDate.getTime())) {
      return 'Ngày không hợp lệ';
    }
    
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Vừa xong';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    }

    return formatDate(date);
  } catch (error) {
    console.error('Error formatting relative time:', error, date);
    return 'Ngày không hợp lệ';
  }
}

export function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength) + '...';
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
