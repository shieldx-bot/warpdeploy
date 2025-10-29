## Các Quy Trình  Lập Lịch
### Giai đoạn 1: loc (các vị ngữ ) 
trong giai đoạn loc ,  trình lập lịch sẽ bỏ qua các nút không phù hợp. các bộ lọc phổ biến bao  gồm

``` bash 

+) PodFitsResoures: Node có đủ CPU và bộ nhớ hay không
+) NoVolumeZoneConflict: Các ổ đĩa có được yêu cầu có sẵn trong vùng của nút này không ? 
+) NodeSelector: nút có khớp với trường nodeSelector của pod không ?
+) PodToleratesNodeTaints: Liệu pod có chấp nhận các lỗi của node không ?


``` 


#### ->  Đôi khi quản trị viên thấy các vấn đề sản xuất khi pod không được lên lịch do bộ lọc quá hạn chế, đặc biệt là khi kết hợp nhiều nodeSelector với các lệch gây hại.


### Giai Đoạn 2: Chấm điểm (Ưu tiên)
#### Trong giai đoạn chấm điểm, các nút còn lại được xếp hạng dựa trên một số chắc năng ưu tiên:


``` bash  

+) LeastRequestedPriority: Ưu tiên các nút có ít tài nguyên được yêu cầu hơn 

+) BalancedResourceAllocation : Ưu tiên các nút có mức sử dụng tài nguyên cân bằng 

+) NodeAffinityPriority: Đưa ra trọng số cho các tùy chọn về mức độ liên quan code nút
```

#### -> Nút có điểm cuối cùng cao nhất sẽ được chọn, lựa chọn ngẫu nhiên sẽ phá vỡ thế bế tắc


## Cơ Chế Lập Lịch Cơ Bản

####1,  Yêu cầu tài nguyên
##### Yêu cầu tài nguyên chỉ định các tài nguyên tối thiểu mà một vùng chứa cần: 

```bash 


apiVersion: v1
kind: Pod
metadata: 
  name: frontend
spec: 
  containers: 
  -  name: app
  image: images.my-company.example/app:v4
  resources: 
    requests:
      memory: "64Mi"
      cpu: "250m"
 ```
 


#### 2, Giới hạn tài nguyên
##### Giới hạn áp dụng giới hạn trên cho mức tiêu thụ


```bash 
resources: 
  requests:
    memory: "64Mi"
    cpu: "250m" 
  limits: 
    memory: "128Mi"
    cpu: "500m"
```


 

#### 3, Node affinity: 

##### Pod này phải chạy trong vùng e2e-az1 và e3e-az2. Bộ lập lịch cũng sẽ cố gắng đắt nó trên các nút có nhãn another-node-label-key
``` bash 
affinity:
  nodeAffinity: 
    requiredDuringSchedulingIgnoreDuringExecution: 
      nodeSelectorTerms: 
      - matchExpressions: 
        - key: kubernetes.io/e2e-az-name
          operator: In
          values: 
          - e2e-az1
          - e3e-az2
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 1
      perference:
        matchExpressions: 
        - key: another-node-label-key
          operator: In
          values:
          - another-node-label-value
```



#### 4, Node anti-affinity: 

##### Pod này không được chạy trên vùng zone1 hữu ích khi vùng này đang gặp sự cố

``` bash 
affinity:
  nodeAffinity: 
    requiredDuringSchedulingIgnoreDuringExecution: 
      nodeSelectorTerms: 
      - matchExpressions: 
        - key: failure-domain.beta.kubernetes.io/zone
          operator: NotIn
          values: 
          - zone1
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 1
      perference:
        matchExpressions: 
        - key: another-node-label-key
          operator: In
          values:
          - another-node-label-value
```

#### 5,  Pod Anti Affinit : Redis leader Deployment (ép Replica nằm gần leader)
##### Leader nên chạy mỗi node mỗi pod (StatefulSet tốt hơn, nhưng ví dụ này deploymnet cho dễ hiểu)
##### Replica sẽ bám theo Leader -> giảm latency



```bash
apiVersion: apps/v1
kind: Deployment
metadata: 
  name: redis-leader
spec: 
  replicas: 1
  selector: 
    matchLabels:
      app: redis-leader
  template: 
    metadata: 
      labels: 
      app: redis-leader
    spec: 
      affinity:
        podAntiAffinity: 
          requireDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLables: 
                app: redis-leader
            topologyKey: kubernetes.io/hostname
      containers: 
      - name: redis
        image: redis:7.2

```

        
#### 6,  Pod Affinity: Redica Deployment(Ưu tiên cùng node để giảm độ trễ) 


```bash


```bash 
appVersion: apps/api
kind: Deployment
metadata: 
  name: resdis-replica
spec: replicas: 2
  repllicas: 2
  selector: 
    matchLabels:
      app: redis-replica
  template:
    metadata: 
      labels: 
        app: redis-replica
    spec: 
      affinity: 
        podAffinity:
          requireDuringSchedulingIgnoredDuringExecution:
          - labelSelector: 
              matchLabels: 
                app: redis-leader
            topologyKey: kubernetes.io/hostname
        podAntiAffinity: 
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100 
            podAffintyTerm:
              labelSelector:
                matchLabels: 
                  app: redis-replica
            topologyKey:  kubernetes.io/hostname
            
      container: 
       - name: redis
         image: redis:7.2

```
 
#### 7, Topology Spread Constrains (Tránh dồn Pod vào một khu vực)
##### Tăng tính sẵn sàng (HA)
##### Giảm rủi ro lỗi lan truyền (blast radius)
##### Cân bằng tài nguyên giữa các node/zone

```bash 
spec: 
  topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector: 
      matchLabels:
        app: web
  
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels: 
        app: web

```



#### 8, Pod Disruption Budget: (DPB) - Kubernetes
##### DPB dùng để giới hạn số Pod bị gián đoạn (disrupted) cùng lúc xảy ra voluntary disruptions 
##### Mục tiêu: đảm bảo ứng dụng vẫn duy trì SLA và không downtime khi "Nâng cấp node, bỏa trì node,  Admin chủ động xóa pod, Autoscaling giảm pod" 
##### Ví dụ sử dụng: Kubernetes khi muốn xóa hoặc dừng pod chủ động -> phải  xin phép APi server qua Eviction API và nếu pod này mà số pod còn lại < minAvailable -> TỪ CHỐI XÓA


```bash 
apiVersion: policy/v1

kind: PodDisruptionBudget
metadata: 
  name: web-pdb
spec: 
  minAvaible: 2
  selector: 
    matchLabels: 
      app: web

```




#### 9, Vertical Pod Autoscaler  (Tự động scale số lượng pod theo tải CPU/Memory)

##### Khi Nào VPA được kích hoạt

##### Khi pod dùng gần hết CPU/RAM -> Request sẽ tăng
##### Khi pod dùng ít hơn nhiều so với request -> request sẽ giảm
##### Khi có rolling update
##### Khi VPA Updater quyết định evict để optimize

```bash
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata: 
  name:web-vpa
spec: 
  targetRef: 
    apiVersion: apps/v1
    kind: Deployment
    name: web
  updatePolicy:
    updateMode: "Auto" 
  resourcePolicy: 
    containerPolices: 
      - containerName: "*"

      minAllowed: 
        cpu: "100m"
        memory: "256"
      maxAllowed:
        cpu: "2000m"
        memory: "4Gi" 
      controlledResources: 
        - cpu
        - memory 
      controlledValues: "RequestAndLimits"


```



#### 10, Data Locality Afinity 
##### Mục Tiêu : pod xử lý dữ liệu được đặt cùng node hoặc cùng topology  với Pod/Data Node
##### Giảm độ trễ netword -> Tăng tốc throughput, IO performance 
##### Hạn chế cross-zone bandwidth cost (đặc biệt cloud)



```bash
apiVersion: apps/v1
kind: Deployment
metadata: 
  name: compute-worker
spec: 
  replicas: 5
  selector: 
    matchLabels:
      app: compute
    template:
      metadata: 
        labels: 
          app: compute
    spec: 
      afinity: 
        nodeAffinity: 

        # --- Node Affinity : Gần node co dữ liệu -- 
          requiredDuringShedulingIgnoreDuringExecution: 
            nodeSelectorTerms:
              - matchExpressions: 
                  - key: data
                    operator: In
                    values: 
                    - hot-storage
          preferrendDuringSchedulingIgnoredDuringExecution:
            - weightL 90
              perference: 
                matchExpressions: 
                  - key: data
                    operator: In
                    values: 
                      - warm-storage
        # --- POd Affinity : gần pod cung cấp dữ liệu --- 
        podAffinity: 
          requireDuringSchedulingIgnoreDuringExecution: 
            - topologyKey: kurbernetes.io/hostname
              labelSelector: 
                matchLabels: 
                  role: data-node 
        
        podAntiffinity: 
          perferredDuringSchedulingIgnoredDuringExecution: 
            - weight: 80
              podAffinityTerm: 
                topologyKey: kerbernetes.io/hostname
                labelSelector: 
                  matchLables: 
                    app: compute
        topologySpreadConstraints: 
          - maxSkew: 1
            whenUnsatisfiable: DoNotSchedule
            topologyKey: topologyKey: topology.kubernetes.io/zone
            labelSelector: 
              matchLabels: 
                app: compute
        containers: 
          - name: compute-worker
            image: myorg/compute:latset
            resources: 
              limits: 
                cpu: 1
                memory: 1Gi 


```
