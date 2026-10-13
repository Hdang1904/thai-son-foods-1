import http from 'http';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('KIỂM THỬ TÍCH HỢP GPS & PHÂN GIẢI SỐ NHÀ, TÊN ĐƯỜNG');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Test Autocomplete "157 nguyễn thái bình"
  console.log('--- TEST 1: Autocomplete input="157 nguyễn thái bình" ---');
  try {
    const res = await fetchJson('http://localhost:3000/api/geo/autocomplete?input=' + encodeURIComponent('157 nguyễn thái bình'));
    console.log('Status:', res.status);
    console.log('Success:', res.body?.success);
    console.log('Predictions count:', res.body?.predictions?.length);
    if (res.body?.predictions?.length > 0) {
      console.log('Top prediction:', res.body.predictions[0]);
      if (res.body.predictions[0].lat && res.body.predictions[0].lng) {
        console.log('-> PASS: Có đầy đủ lat, lng!');
        passed++;
      } else {
        console.log('-> FAIL: Thiếu lat hoặc lng');
        failed++;
      }
    } else {
      console.log('-> FAIL: Không có prediction nào');
      failed++;
    }
  } catch (e) {
    console.error('Lỗi gọi API:', e);
    failed++;
  }

  // 2. Test Autocomplete với context quận: "157 nguyễn thái bình" & district="Quận Tân Bình"
  console.log('\n--- TEST 2: Autocomplete input="157 nguyễn thái bình" & district="Quận Tân Bình" ---');
  try {
    const res = await fetchJson('http://localhost:3000/api/geo/autocomplete?input=' + encodeURIComponent('157 nguyễn thái bình') + '&district=' + encodeURIComponent('Quận Tân Bình'));
    console.log('Predictions count:', res.body?.predictions?.length);
    const top = res.body?.predictions?.[0];
    console.log('Top prediction description:', top?.description);
    if (top && top.description.includes('Tân Bình')) {
      console.log('-> PASS: Ưu tiên chính xác Quận Tân Bình theo ngữ cảnh!');
      passed++;
    } else {
      console.log('-> FAIL: Không ưu tiên đúng Quận Tân Bình');
      failed++;
    }
  } catch (e) {
    console.error('Lỗi gọi API:', e);
    failed++;
  }

  // 3. Test Autocomplete "472 lê trọng tấn"
  console.log('\n--- TEST 3: Autocomplete input="472 lê trọng tấn" ---');
  try {
    const res = await fetchJson('http://localhost:3000/api/geo/autocomplete?input=' + encodeURIComponent('472 lê trọng tấn'));
    const top = res.body?.predictions?.[0];
    console.log('Top prediction:', top?.description, `(lat: ${top?.lat}, lng: ${top?.lng})`);
    if (top && top.lat && top.lng && top.main_text.includes('472')) {
      console.log('-> PASS: Bóc tách chính xác số nhà 472 và định vị Lê Trọng Tấn!');
      passed++;
    } else {
      console.log('-> FAIL: Không bóc tách được số nhà hoặc thiếu tọa độ');
      failed++;
    }
  } catch (e) {
    console.error('Lỗi gọi API:', e);
    failed++;
  }

  // 4. Test Geocode "157 Nguyễn Thái Bình"
  console.log('\n--- TEST 4: Geocode address="157 Nguyễn Thái Bình" ---');
  try {
    const res = await fetchJson('http://localhost:3000/api/geo/geocode?address=' + encodeURIComponent('157 Nguyễn Thái Bình'));
    console.log('Status:', res.status);
    console.log('Geocode result:', res.body);
    if (res.body?.success && res.body?.lat && res.body?.lng) {
      console.log(`-> PASS: Phân giải thành công tọa độ GPS (lat: ${res.body.lat}, lng: ${res.body.lng})`);
      passed++;
    } else {
      console.log('-> FAIL: Geocode không trả về tọa độ');
      failed++;
    }
  } catch (e) {
    console.error('Lỗi gọi API:', e);
    failed++;
  }

  // 5. Test Geocode "157 Nguyễn Thái Bình" có kèm district="Quận Tân Bình"
  console.log('\n--- TEST 5: Geocode address="157 Nguyễn Thái Bình" & district="Quận Tân Bình" ---');
  try {
    const res = await fetchJson('http://localhost:3000/api/geo/geocode?address=' + encodeURIComponent('157 Nguyễn Thái Bình') + '&district=' + encodeURIComponent('Quận Tân Bình'));
    console.log('Geocode result:', res.body?.components, `(lat: ${res.body?.lat}, lng: ${res.body?.lng})`);
    if (res.body?.success && res.body?.components?.district?.includes('Tân Bình')) {
      console.log('-> PASS: Định vị chính xác đường Nguyễn Thái Bình tại Tân Bình!');
      passed++;
    } else {
      console.log('-> FAIL: Định vị sai quận');
      failed++;
    }
  } catch (e) {
    console.error('Lỗi gọi API:', e);
    failed++;
  }

  // 6. Test Geocode địa chỉ ở tỉnh khác: "56 Nguyễn Trãi, Thanh Xuân, Hà Nội"
  console.log('\n--- TEST 6: Geocode address="56 Nguyễn Trãi, Thanh Xuân, Hà Nội" ---');
  try {
    const res = await fetchJson('http://localhost:3000/api/geo/geocode?address=' + encodeURIComponent('56 Nguyễn Trãi, Thanh Xuân, Hà Nội'));
    console.log('Geocode result:', res.body?.formattedAddress, `(lat: ${res.body?.lat}, lng: ${res.body?.lng})`);
    if (res.body?.success && res.body?.lat > 20) { // Tọa độ Hà Nội lat ~ 21
      console.log('-> PASS: Định vị chính xác địa chỉ tại Hà Nội!');
      passed++;
    } else {
      console.log('-> FAIL: Không định vị được địa chỉ Hà Nội');
      failed++;
    }
  } catch (e) {
    console.error('Lỗi gọi API:', e);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
