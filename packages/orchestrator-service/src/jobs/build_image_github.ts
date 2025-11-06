import axios from 'axios';

export const triggerImageBuild = async (
  owner: string,
  repo: string,
  cloneUrl: string
): Promise<string | null> => {
  const workflowFileName = 'BuildAndPush.yaml';
  const githubToken = process.env.GITHUB_TOKEN;
  const dockerhub_username = process.env.DOCKER_HUB_USERNAME;
  const dockerhub_token = process.env.DOCKER_HUB_TOKEN;
  const image_name = Math.random().toString(36).substring(2, 8);

  if (!githubToken) {
    console.error('Lỗi: Vui lòng cung cấp GITHUB_PAT hoặc GITHUB_TOKEN trong biến môi trường.');
    return null;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`;
  console.log(`Đang gửi yêu cầu kích hoạt workflow tới: ${url}`);

  try {
    const response = await axios.post(
      url,
      {
        ref: 'main',
        inputs: {
          image_name,
          clone_url: cloneUrl,
          dockerhub_username,
          dockerhub_token,
          ip: 'https://rimy-ophelia-gristliest.ngrok-free.dev',
        },
      },
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 204) {
      console.log('Kích hoạt workflow thành công!');
      console.log('Log chi tiết response:', response.data);
      console.log(`Image sẽ được build với tag: ${image_name}`);
      return image_name;
    } else {
      console.error(`Kích hoạt thất bại với status code: ${response.status}`);
      return null;
    }
  } catch (error: any) {
    console.error('Đã xảy ra lỗi khi gọi GitHub API:', error.response ? error.response.data : error.message);
    return null;
  }
};
