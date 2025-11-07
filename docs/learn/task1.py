# Test 1

from ast import main
import math


#Cau 1:  Nhap vao mot day so nguyen cach nhau boi dau cach va chuyen doi chung thanh mot danh sach
def cau1(): 
    input_string = input("Moi ban nhap vao mot day so nguyen cach nhau boi dau cach: ")
    number_list = [int(num) for num in input_string.split(',')]
    print("Danh sach so nguyen:", number_list)
    return number_list

# Cau 2: Tinh tong va  trung binh cong  cua cac so trong danh sach
def cau2(number_list): 
    total = sum(number_list)
    average = total / len(number_list) if number_list else 0
    print("Tong cua cac so trong danh sach:", total)
    print("Trung binh cong cua cac so trong danh sach:", average)

# Cau 3:  tim vi tri so am dau tien va cuoi cung trong danh sach
def cau3(number_list):
    index_first_negative = -1
    index_last_negative = -1
    for index, num in enumerate(number_list):
        if num < 0: 
            if index_first_negative == -1: 
                index_first_negative = index
            index_last_negative = index

    print("Vi tri so am dau tien trong danh sach:", index_first_negative)
    print("Vi tri so am cuoi cung trong danh sach:", index_last_negative)



# Cau 4: Dem so luong so duong lien tiep lon nhat trong danh sach
def cau4(number_list):
    count = 0
    for num in number_list: 
        if num >  0: 
            count += 1
        else: 
            count = 0 

    print("So luong so duong lien tiep lon nhat trong danh sach:", count)

# Cau 5: Cac so chan trong danh sach
def cau5(number_list): 
    list_chan = []
    for num in number_list:
        if num % 2 == 0: 
            list_chan.append(num)
        
    print("Cac so chan trong danh sach:", list_chan)


# Cau 6: Cac so le trong danh sach

def cau6(number_list):
    list_le = []
    for num in number_list:
        if num % 2 != 0: 
            list_le.append(num)
        
    print("Cac so le trong danh sach:", list_le)


# Cau 7: 
def cau7(number_list):
    num_max = number_list[0] if number_list else None
    num_max_index = -1
    for index, num in enumerate (number_list): 
        if num > num_max: 
            num_max = num
            num_max_index = index

    print("\n So lon nhat trong danh sach:", num_max)
    print("Vi tri so lon nhat trong danh sach:", num_max_index)
# Cau 8: loai bo cac so cung nhau trong danh sach
def cau8(number_list):
    for num in number_list:
        if number_list.count(num) > 1: 
            while number_list.count(num) > 0: 
                number_list.remove(num)

    print("Danh sach sau khi loai bo cac so cung nhau:", number_list)


# Cau 9:  Sap xep theo thu tu tang dan
def cau9(number_list): 
    for i in  number_list:
        for j in range(len(number_list)-1): 
            if number_list[i] > number_list[j + 1]: 
                temp = number_list[i]
                number_list[i] = number_list[j + 1]
                number_list[j + 1] = temp

    print("Danh sach sau khi sap xep theo thu tu tang dan:", number_list)
# Cau 10: Nhap vao mot so x roi chen x vao danh sach nhung van giu tang dan
def cau10(number_list):
    x = int(input("Moi ban nhap vao mot so x: "))
    number_list.append(x)
    number_list.sort()
    print("Danh sach sau khi chen x vao van giu tang dan:", number_list)


def cau11(list_number): 
    list_chinh_phuong = []
    for i in  list_number: 
        if math.sqrt(i) * math.sqrt(i) == i: 
            list_chinh_phuong.append(i)

    print("Cac so chinh phuong trong danh sach:", list_chinh_phuong)

# Dua ra so luong phan tu dan dau dai nhat 
def cau12(number_list):
    max_length = 0 
    current_length = 0 
    for index, num in  enumerate(number_list): 
        if number_list[index] * number_list[index - 1] < 0: 
            current_length += 1
        else: 
            current_length = 1

        max_length = max(max_length, current_length)
    print("So luong phan tu dan dau dai nhat trong danh sach:", max_length)
    print("\n")


def cau13(number_list): 
    list_so_chinh_phuong = []
    for i in number_list: 
        if math.sqrt(i) * math.sqrt(i) == i: 
            list_so_chinh_phuong.append(i)

    print("Cac so chinh phuong trong danh sach:", list_so_chinh_phuong)


# Xap xep giam dan
def cau14(number_list):
     number_list.sort(reverse=True)
     print("Danh sach sau khi sap xep giam dan:", number_list)
     

# Nhap phan tu thu k va xoa phan tu thu k 

def cau15(number_list):  
    while True:
        k = int(input("Moi ban nhap gia tri K: "))
        if 0 <= k < len(number_list): 
            number_list.pop(k)
            print("Danh sach sau khi xoa phan tu thu k:", number_list)
            break
        else:
            print("Gia tri K khong hop le. Vui long nhap lai.")

def cau16(number_list): 
    list_so_lap_lai = []
    for i in number_list:
        if  number_list.count(i) > 1 and i not in list_so_lap_lai: 
            list_so_lap_lai.append(i)

    print("So luong cac so lap lai trong danh sach: ", len(list_so_lap_lai) )
    print("Cac so lap lai trong danh sach:", list_so_lap_lai)


# Dao thu tu danh sach
def cau17(number_list):
    number_list.reverse()
    print(" Danh sach sau khi dao nguoc thu tu:", number_list)



# 
def cau18(number_list): 
    list_so_nguyen_to = []
    for num in number_list: 
        if num > 1:
            is_prime = True
            for i in range(2, int(math.sqrt(num) ) + 1):
                if num % i == 0: 
                    is_prime = False
                    break
        if is_prime:
            list_so_nguyen_to.append(num)
    print("Cac so nguyen to trong danh sach:", list_so_nguyen_to)

def cau19(number_list):
    x = int(input("Moi ban nhap vao mot so x: "))
    if number_list.count(x) > 0: 
        print("So x co trong danh sach")
    else: 
        number_list.append(x)
        print("So x da duoc them vao danh sach:", number_list)
def main(): 
    number_list = cau1()
    cau2(number_list)
    cau3(number_list)
    cau4(number_list)
    cau5(number_list)
    cau6(number_list)
    cau7(number_list)
    cau8(number_list)
    cau9(number_list)
    cau10(number_list)
    cau11(number_list)
    cau12(number_list)
    cau13(number_list)
    cau14(number_list)
    cau15(number_list)
    cau16(number_list)
    cau17(number_list)
    cau18(number_list)
    cau19(number_list)

if __name__ == "__main__":
    main()