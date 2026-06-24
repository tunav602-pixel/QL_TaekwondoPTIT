/**
 * Chuẩn hóa API Response — Học từ MoneyPrinterTurbo utils.get_response()
 * 
 * Thay vì mỗi controller tự viết { success: true/false, message, data },
 * dùng helper class để đảm bảo format nhất quán. Frontend chỉ cần
 * kiểm tra response.success là biết trạng thái, không cần guess.
 */

export class ApiResponse {
  /**
   * Response thành công
   * @param {import('express').Response} res - Express response object
   * @param {*} data - Dữ liệu trả về
   * @param {string} message - Thông điệp
   * @param {number} statusCode - HTTP status code (default 200)
   */
  static success(res, data = null, message = 'Thành công', statusCode = 200) {
    const response = {
      success: true,
      status: statusCode,
      message,
    };
    if (data !== null && data !== undefined) {
      response.data = data;
    }
    return res.status(statusCode).json(response);
  }

  /**
   * Response lỗi
   * @param {import('express').Response} res - Express response object
   * @param {string} message - Thông điệp lỗi
   * @param {number} statusCode - HTTP status code (default 500)
   * @param {*} errors - Chi tiết lỗi (validation errors, etc.)
   */
  static error(res, message = 'Lỗi server nội bộ', statusCode = 500, errors = null) {
    const response = {
      success: false,
      status: statusCode,
      message,
    };
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }

  /**
   * Response phân trang — hữu ích cho danh sách giao dịch, khoản chi
   * @param {import('express').Response} res
   * @param {Array} data - Dữ liệu trang hiện tại
   * @param {number} total - Tổng số bản ghi
   * @param {number} page - Trang hiện tại
   * @param {number} pageSize - Số bản ghi mỗi trang
   * @param {string} message
   */
  static paginated(res, data, total, page, pageSize, message = 'Thành công') {
    return res.status(200).json({
      success: true,
      status: 200,
      message,
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }

  /**
   * Response cho tác vụ bất đồng bộ (202 Accepted)
   * Dùng khi tạo batch operations (gửi thông báo hàng loạt, xuất báo cáo...)
   * Client sẽ dùng taskId để polling trạng thái qua /api/tasks/:taskId
   * @param {import('express').Response} res
   * @param {string} taskId - ID tác vụ để client polling
   * @param {string} message
   */
  static accepted(res, taskId, message = 'Đang xử lý...') {
    return res.status(202).json({
      success: true,
      status: 202,
      message,
      taskId,
    });
  }

  /**
   * Response tạo mới thành công (201 Created)
   * @param {import('express').Response} res
   * @param {*} data
   * @param {string} message
   */
  static created(res, data = null, message = 'Tạo mới thành công') {
    return ApiResponse.success(res, data, message, 201);
  }
}
