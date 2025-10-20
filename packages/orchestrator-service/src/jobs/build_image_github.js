const axios =  require ('axios');
const { v4: uuidv4 } = require('uuid');
 /**
 * Kích hoạt GitHub Action để build và push image Docker.
 * @param {string} owner - Tên chủ sở hữu repository.
 * @param {string} repo - Tên repository.
 * @param {string} workflowFileName - Tên tệp workflow YAML (ví dụ: 'build-and-push.yml').
 * @param {string} imageTag - Tag bạn muốn gán cho image (ví dụ: 'v1.0.0', 'latest').
 */
  const  triggerImageBuild = async (
   cloneUrl
) => {
  // Lấy token từ biến môi trường để bảo mật
  const owner = "manhbv22810230133-dot"; // Thay bằng tên tài khoản GitHub của bạn
  const repo = "warpdeploy"; // Thay bằng tên repository của bạn
  const workflowFileName = "BuildAndPush.yaml"; // Thay bằng tên file YAML của bạn
  const githubToken = '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';
  const dockerhub_username = "shieldxbot";
  const dockerhub_token ="dckr_pat_VKOILaVRfGVpE5zI3miU7rhJsi4"
  const image_name = Math.random().toString(36).substring(2, 8);

  if (!githubToken) {
    console.error("Lỗi: Vui lòng cung cấp GITHUB_PAT hoặc GITHUB_TOKEN trong biến môi trường.");
    return null;
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
        ref: "main",

        // Cung cấp các giá trị cho các 'inputs' đã định nghĩa trong YAML
        inputs: {
          image_name: image_name,
          clone_url: cloneUrl,
          dockerhub_username: dockerhub_username,
          dockerhub_token: dockerhub_token
        },
      },
      // ---- PHẦN HEADERS ----
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // GitHub API trả về status 204 No Content khi thành công
    if (response.status === 204) {
      console.log("Kích hoạt workflow thành công!");
      console.log("Log chi tiết response:", response.data);
      console.log(`Image sẽ được build với tag: ${image_name}`);
      return image_name;
    } else {
      console.error(`Kích hoạt thất bại với status code: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(
      "Đã xảy ra lỗi khi gọi GitHub API:",
      error.response ? error.response.data : error.message
    );
    return null ;
  }
}
// --- VÍ DỤ SỬ DỤNG ---

const cloneUrl = "https://github.com/shieldx-bot/backend_exemple.git";

// Gọi hàm để build image với tag 'v1.2.5'
// triggerImageBuild(cloneUrl);

// Hoặc gọi hàm để build image với tag 'beta'
// triggerImageBuild(repoOwner, repoName, workflowFile, 'beta');


module.exports = { triggerImageBuild };
