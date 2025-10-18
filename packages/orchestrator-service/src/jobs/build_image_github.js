const axios = require('axios');

/**
 * Kích hoạt GitHub Action để build và push image Docker.
 * @param {string} owner - Tên chủ sở hữu repository.
 * @param {string} repo - Tên repository.
 * @param {string} workflowFileName - Tên tệp workflow YAML (ví dụ: 'build-and-push.yml').
 * @param {string} imageTag - Tag bạn muốn gán cho image (ví dụ: 'v1.0.0', 'latest').
 */
async function triggerImageBuild(owner, repo, workflowFileName, imageTag) {
  // Lấy token từ biến môi trường để bảo mật
  const githubToken = process.env.GITHUB_PAT;

  if (!githubToken) {
    console.error('Lỗi: Vui lòng cung cấp GITHUB_PAT trong biến môi trường.');
    return;
  }

  // URL của API endpoint để kích hoạt workflow
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`;

  console.log(`Đang gửi yêu cầu kích hoạt workflow tới: ${url}`);

  try {
    const response = await axios.post(
      url,
      // ---- PHẦN BODY CỦA YÊU CẦU ----
      {
        // Chạy workflow trên phiên bản code của nhánh 'main'
        ref: 'main', 
        
        // Cung cấp các giá trị cho các 'inputs' đã định nghĩa trong YAML
        inputs: {
          // Khóa 'image_tag' phải khớp chính xác với tên input trong file YAML
          image_tag: imageTag 
        }
      },
      // ---- PHẦN HEADERS ----
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // GitHub API trả về status 204 No Content khi thành công
    if (response.status === 204) {
      console.log('Kích hoạt workflow thành công!');
      console.log(`Image sẽ được build với tag: ${imageTag}`);
    } else {
      console.error(`Kích hoạt thất bại với status code: ${response.status}`);
    }
  } catch (error) {
    console.error('Đã xảy ra lỗi khi gọi GitHub API:', error.response ? error.response.data : error.message);
  }
}
// --- VÍ DỤ SỬ DỤNG ---
const repoOwner = 'shieldx-bot';       // Thay bằng tên tài khoản GitHub của bạn
const repoName = 'warpdeploy';          // Thay bằng tên repository của bạn
const workflowFile = 'BuildAndPush.yaml'; // Thay bằng tên file YAML của bạn

// Gọi hàm để build image với tag 'v1.2.5'
triggerImageBuild(repoOwner, repoName, workflowFile, 'v1.2.5');

// Hoặc gọi hàm để build image với tag 'beta'
// triggerImageBuild(repoOwner, repoName, workflowFile, 'beta');