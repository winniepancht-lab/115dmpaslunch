// 替換為您的 Google Apps Script Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbw1Jft9XsWLlV3c6SbV0DKGRsgR8QE2sbrYi70j6mxi3nWPLmMsN2y67Owg5Lu8y8b_/exec';
document.getElementById('date').valueAsDate = new Date();

document.getElementById('lunchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const statusMsg = document.getElementById('statusMsg');
    
    submitBtn.disabled = true;
    submitBtn.innerText = '資料寫入中...';
    statusMsg.innerText = '';
    statusMsg.className = 'mt-3 text-center fw-bold';

    const formData = new URLSearchParams();
    formData.append('date', document.getElementById('date').value);
    formData.append('classId', document.getElementById('classId').value);
    formData.append('menu', document.getElementById('menu').value);
    formData.append('feedback', document.getElementById('feedback').value);
    formData.append('photoUrl', document.getElementById('photoUrl').value);
    formData.append('reply', document.getElementById('reply').value);

    fetch(GAS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    })
    .then(response => response.json())
    .then(data => {
        if(data.status === 'success') {
            statusMsg.innerText = '✅ 紀錄已成功寫入！前台將同步更新。';
            statusMsg.classList.add('text-success');
            document.getElementById('lunchForm').reset();
            document.getElementById('date').valueAsDate = new Date(); 
        } else {
            throw new Error(data.message || '寫入失敗');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        statusMsg.innerText = '⚠️ 請求已送出，請至前台檢查是否更新成功。';
        statusMsg.classList.add('text-warning');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerText = '送出紀錄';
    });
});
