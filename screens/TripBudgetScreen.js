import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { createTripExpense, EXPENSE_CATEGORIES, filterTripExpenses, parseExpenseAmount, summarizeTripExpenses } from '../lib/tripExpenses';

const CURRENCIES = ['USD', 'EUR', 'CNY', 'JPY', 'SGD', 'GBP', 'AUD', 'CAD'];

function formatDate(date) {
  return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
}

export default function TripBudgetScreen({ route, navigation, trips, setTrips }) {
  const { t, i18n } = useTranslation();
  const { tripId } = route.params;
  const trip = trips.find(item => item.id === tripId);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showEditor, setShowEditor] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');

  if (!trip) return null;

  const expenses = Array.isArray(trip.expenses) ? trip.expenses : [];
  const totals = summarizeTripExpenses(expenses);
  const currencies = Object.keys(totals.totals).sort();
  const visibleExpenses = filterTripExpenses(expenses, { query, category: categoryFilter, currency: currencyFilter, sort });
  const categoryLabel = value => t(`expense_category_${value}`);

  const updateExpenses = next => setTrips(current => current.map(item => item.id === tripId ? { ...item, expenses: next } : item));

  const openCreate = () => {
    setEditingExpense(null);
    setAmount(''); setCurrency(currencies[0] || 'USD'); setCategory('food'); setDate(new Date()); setNote('');
    setShowEditor(true);
  };

  const openEdit = expense => {
    setEditingExpense(expense);
    setAmount(String(expense.amount)); setCurrency(expense.currency); setCategory(expense.category);
    const [year, month, day] = expense.date.split('.').map(Number);
    setDate(new Date(year, month - 1, day)); setNote(expense.note || '');
    setShowEditor(true);
  };

  const saveExpense = () => {
    try {
      const value = createTripExpense({
        amount: parseExpenseAmount(amount), currency, category, date: formatDate(date), note,
        id: editingExpense?.id,
      });
      updateExpenses(editingExpense
        ? expenses.map(expense => expense.id === editingExpense.id ? value : expense)
        : [...expenses, value]);
      setShowEditor(false);
    } catch {
      Alert.alert(t('expense_amount'), t('expense_invalid_amount'));
    }
  };

  const deleteExpense = expense => Alert.alert(t('expense_delete'), t('expense_delete_confirm'), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('delete'), style: 'destructive', onPress: () => updateExpenses(expenses.filter(item => item.id !== expense.id)) },
  ]);

  const cycleSort = () => setSort(current => current === 'newest' ? 'oldest' : current === 'oldest' ? 'amount' : 'newest');

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← {t('back')}</Text></TouchableOpacity>
          <View style={s.headerTitleWrap}>
            <Text style={s.title}>{t('expense_title')}</Text>
            <Text style={s.subtitle} numberOfLines={1}>{trip.emoji} {trip.city}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('expense_add')} onPress={openCreate} style={s.addButton}><Text style={s.addText}>＋</Text></TouchableOpacity>
        </View>

        <View style={s.summary}>
          <Text style={s.sectionLabel}>{t('expense_total')}</Text>
          {currencies.length ? (
            <View style={s.totalsWrap}>
              {currencies.map(code => (
                <TouchableOpacity key={code} onPress={() => setCurrencyFilter(currencyFilter === code ? 'all' : code)} style={[s.totalItem, currencyFilter === code && s.totalItemActive]}>
                  <Text style={s.totalCurrency}>{code}</Text>
                  <Text style={s.totalAmount}>{totals.totals[code].toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : <Text style={s.noTotal}>—</Text>}
        </View>

        {currencies.length > 0 && (
          <View style={s.breakdown}>
            <Text style={s.sectionLabel}>{t('expense_breakdown')}</Text>
            <View style={s.breakdownRows}>
              {currencies.flatMap(code => EXPENSE_CATEGORIES
                .filter(key => totals.categories[code]?.[key])
                .map(key => (
                  <View key={`${code}-${key}`} style={s.breakdownRow}>
                    <Text style={s.breakdownCategory}>{categoryLabel(key)}</Text>
                    <Text style={s.breakdownCurrency}>{code}</Text>
                    <Text style={s.breakdownAmount}>{totals.categories[code][key].toFixed(2)}</Text>
                  </View>
                )))}
            </View>
          </View>
        )}

        <TextInput accessibilityLabel={t('expense_search')} value={query} onChangeText={setQuery} placeholder={t('expense_search')} placeholderTextColor="#666" clearButtonMode="while-editing" returnKeyType="search" style={s.search} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters}>
          <View style={s.filterRow}>
            {['all', ...EXPENSE_CATEGORIES].map(key => {
              const active = categoryFilter === key;
              return <TouchableOpacity key={key} onPress={() => setCategoryFilter(key)} style={[s.chip, active && s.chipActive]}><Text style={[s.chipText, active && s.chipTextActive]}>{key === 'all' ? t('expense_filter_all') : categoryLabel(key)}</Text></TouchableOpacity>;
            })}
          </View>
        </ScrollView>
        <View style={s.listHeading}>
          <Text style={s.sectionLabel}>{t('expense_records', { count: visibleExpenses.length })}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={cycleSort} style={s.sortButton}><Text style={s.sortText}>{sort === 'amount' ? '↓ ' + t('expense_sort_amount') : sort === 'oldest' ? '↑ ' + t('expense_sort_oldest') : '↓ ' + t('expense_sort_newest')}</Text></TouchableOpacity>
        </View>

        {visibleExpenses.length ? visibleExpenses.map(expense => (
          <View key={String(expense.id)} style={s.expenseRow}>
            <TouchableOpacity accessibilityRole="button" onPress={() => openEdit(expense)} style={s.expenseMain}>
              <View style={s.expenseTop}>
                <Text style={s.expenseCategory}>{categoryLabel(expense.category)}</Text>
                <Text style={s.expenseAmount}>{expense.currency} {Number(expense.amount).toFixed(2)}</Text>
              </View>
              <Text style={s.expenseNote} numberOfLines={2}>{expense.note || categoryLabel(expense.category)}</Text>
              <Text style={s.expenseDate}>{expense.date}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('delete')} onPress={() => deleteExpense(expense)} style={s.deleteButton}><Text style={s.deleteText}>×</Text></TouchableOpacity>
          </View>
        )) : (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>◷</Text>
            <Text style={s.emptyTitle}>{t(expenses.length ? 'expense_no_results' : 'expense_empty_title')}</Text>
            <Text style={s.emptyHint}>{t(expenses.length ? 'expense_no_results_hint' : 'expense_empty_hint')}</Text>
            {!expenses.length && <TouchableOpacity onPress={openCreate} style={s.emptyAction}><Text style={s.emptyActionText}>{t('expense_add')}</Text></TouchableOpacity>}
          </View>
        )}
      </ScrollView>

      <Modal visible={showEditor} transparent animationType="slide" onRequestClose={() => setShowEditor(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{t(editingExpense ? 'expense_edit' : 'expense_add')}</Text>
              <TouchableOpacity onPress={() => setShowEditor(false)}><Text style={s.close}>×</Text></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>{t('expense_amount')}</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#666" style={s.amountInput} autoFocus accessibilityLabel={t('expense_amount')} />
            <Text style={s.fieldLabel}>{t('expense_currency')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.optionScroll}><View style={s.optionRow}>
              {CURRENCIES.map(code => <TouchableOpacity key={code} onPress={() => setCurrency(code)} style={[s.optionChip, currency === code && s.optionChipActive]}><Text style={[s.optionText, currency === code && s.optionTextActive]}>{code}</Text></TouchableOpacity>)}
            </View></ScrollView>
            <Text style={s.fieldLabel}>{t('expense_category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.optionScroll}><View style={s.optionRow}>
              {EXPENSE_CATEGORIES.map(key => <TouchableOpacity key={key} onPress={() => setCategory(key)} style={[s.optionChip, category === key && s.optionChipActive]}><Text style={[s.optionText, category === key && s.optionTextActive]}>{categoryLabel(key)}</Text></TouchableOpacity>)}
            </View></ScrollView>
            <Text style={s.fieldLabel}>{t('expense_date')}</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(value => !value)} style={s.dateButton}><Text style={s.dateButtonText}>{formatDate(date)}　⌄</Text></TouchableOpacity>
            {showDatePicker && <DateTimePicker value={date} mode="date" display="spinner" maximumDate={new Date()} locale={i18n.language} onChange={(_, selected) => { if (selected) setDate(selected); }} />}
            <Text style={s.fieldLabel}>{t('expense_note')}</Text>
            <TextInput value={note} onChangeText={setNote} placeholder={t('expense_note_placeholder')} placeholderTextColor="#666" style={s.noteInput} maxLength={140} />
            <View style={s.modalActions}>
              <TouchableOpacity onPress={() => setShowEditor(false)} style={s.cancel}><Text style={s.cancelText}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveExpense} style={s.save}><Text style={s.saveText}>{t('save')}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0D0D0D'}, scroll:{padding:20,paddingBottom:40},
  header:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:20}, back:{fontSize:14,color:'#D4AF37'},
  headerTitleWrap:{flex:1}, title:{fontSize:21,color:'#F0EDE8'}, subtitle:{fontSize:12,color:'#777',marginTop:3},
  addButton:{width:40,height:40,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#D4AF3718',borderWidth:1,borderColor:'#D4AF3750'}, addText:{fontSize:25,color:'#D4AF37',lineHeight:29},
  summary:{padding:16,backgroundColor:'#151515',borderWidth:1,borderColor:'#262626',borderRadius:14,marginBottom:12}, sectionLabel:{fontSize:11,color:'#888',textTransform:'uppercase'}, totalsWrap:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:10},
  totalItem:{minWidth:112,padding:10,borderRadius:10,backgroundColor:'#1C1C1C',borderWidth:1,borderColor:'#292929'}, totalItemActive:{borderColor:'#4ECDC4'}, totalCurrency:{fontSize:10,color:'#777'}, totalAmount:{fontSize:19,color:'#E8E3D9',marginTop:3}, noTotal:{fontSize:22,color:'#555',marginTop:5},
  breakdown:{paddingHorizontal:4,marginBottom:16}, breakdownRows:{marginTop:7}, breakdownRow:{flexDirection:'row',alignItems:'center',paddingVertical:6,borderBottomWidth:1,borderBottomColor:'#1C1C1C'}, breakdownCategory:{flex:1,fontSize:12,color:'#AAA'}, breakdownCurrency:{fontSize:10,color:'#666',marginRight:10}, breakdownAmount:{fontSize:12,color:'#CCC',minWidth:72,textAlign:'right'},
  search:{backgroundColor:'#161616',borderWidth:1,borderColor:'#2A2A2A',borderRadius:10,color:'#F0EDE8',paddingHorizontal:12,paddingVertical:10,fontSize:14,marginBottom:10}, filters:{maxHeight:38,marginBottom:14}, filterRow:{flexDirection:'row',gap:7}, chip:{paddingHorizontal:11,paddingVertical:7,borderRadius:15,backgroundColor:'#161616',borderWidth:1,borderColor:'#292929'}, chipActive:{borderColor:'#4ECDC477',backgroundColor:'#4ECDC418'}, chipText:{fontSize:11,color:'#888'},chipTextActive:{color:'#4ECDC4'},
  listHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8}, sortButton:{paddingVertical:6,paddingHorizontal:8},sortText:{fontSize:11,color:'#D4AF37'},
  expenseRow:{flexDirection:'row',alignItems:'center',backgroundColor:'#151515',borderWidth:1,borderColor:'#242424',borderRadius:12,marginBottom:8},expenseMain:{flex:1,padding:14},expenseTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},expenseCategory:{fontSize:12,color:'#4ECDC4'},expenseAmount:{fontSize:15,color:'#F0EDE8',fontWeight:'600'},expenseNote:{fontSize:13,color:'#BBB',marginTop:7},expenseDate:{fontSize:10,color:'#666',marginTop:6},deleteButton:{width:42,alignItems:'center',justifyContent:'center',alignSelf:'stretch'},deleteText:{fontSize:20,color:'#777'},
  empty:{alignItems:'center',paddingVertical:48,paddingHorizontal:20},emptyIcon:{fontSize:40,color:'#4ECDC4',marginBottom:12},emptyTitle:{fontSize:16,color:'#DDD'},emptyHint:{fontSize:12,color:'#777',textAlign:'center',marginTop:7,lineHeight:18},emptyAction:{marginTop:16,paddingHorizontal:16,paddingVertical:9,borderWidth:1,borderColor:'#D4AF3760',borderRadius:14},emptyActionText:{color:'#D4AF37',fontSize:12},
  modalOverlay:{flex:1,justifyContent:'flex-end',backgroundColor:'#000000AA'},sheet:{backgroundColor:'#111',borderTopLeftRadius:20,borderTopRightRadius:20,padding:20,paddingBottom:28,borderTopWidth:1,borderColor:'#2A2A2A'},sheetHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},sheetTitle:{fontSize:18,color:'#F0EDE8'},close:{fontSize:24,color:'#777',paddingHorizontal:6},fieldLabel:{fontSize:11,color:'#888',marginTop:8,marginBottom:6},amountInput:{fontSize:25,color:'#F0EDE8',backgroundColor:'#1A1A1A',borderRadius:10,padding:12,borderWidth:1,borderColor:'#2A2A2A'},optionScroll:{maxHeight:38},optionRow:{flexDirection:'row',gap:7},optionChip:{paddingHorizontal:11,paddingVertical:7,borderRadius:14,borderWidth:1,borderColor:'#303030'},optionChipActive:{borderColor:'#D4AF37',backgroundColor:'#D4AF3718'},optionText:{fontSize:11,color:'#888'},optionTextActive:{color:'#D4AF37'},dateButton:{padding:11,backgroundColor:'#1A1A1A',borderRadius:9},dateButtonText:{fontSize:13,color:'#CCC'},noteInput:{padding:11,backgroundColor:'#1A1A1A',borderRadius:9,color:'#F0EDE8',fontSize:13},modalActions:{flexDirection:'row',gap:10,marginTop:16},cancel:{flex:1,alignItems:'center',padding:13,backgroundColor:'#1A1A1A',borderRadius:10},cancelText:{color:'#AAA'},save:{flex:1,alignItems:'center',padding:13,backgroundColor:'#D4AF37',borderRadius:10},saveText:{color:'#111',fontWeight:'600'},
});
